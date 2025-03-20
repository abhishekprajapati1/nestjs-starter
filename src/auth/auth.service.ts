import { compareString, hashString } from '../../lib/utils';
import { BadRequestException, Injectable } from '@nestjs/common';
import {
  IWithTransactionClient,
  PrismaService,
} from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { TokenService } from '../token/token.service';
import { MailService } from '../mail/mail.service';
import dayjs from '../../lib/dayjs';
import { ResetPasswordDto } from './dto/password.dto';
import { UserRole } from '@prisma/client';

interface IResetPassword extends IWithTransactionClient {
  data: ResetPasswordDto;
  id: number;
}

interface ISendEmailAfterSignup {
  email: string;
  id: number;
  resending?: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private tokenService: TokenService,
    private mailService: MailService,
  ) {}

  async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: number) {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: SignupDto) {
    const { credentials, ...rest } = data;
    credentials.password = await hashString(credentials.password);
    return await this.prisma.user.create({
      data: {
        ...rest,
        username: rest.email.split('@')[0],
        role: UserRole.student,
        credentials: {
          create: credentials,
        },
      },
      select: {
        id: true,
        email: true,
      },
    });
  }

  async sendEmailAfterSignup({ email, id, resending }: ISendEmailAfterSignup) {
    const token = this.tokenService.generateToken(
      { id, email: email },
      { expiresIn: '1d' },
    );
    const href = `verify-email?token=${token}&email=${email}`;
    const bodyHTML = resending
      ? `
        Greetings from Akku ka chasma. We are glad that you chose us. This email is sent to you by request; igonre this email if you didn't requested.
        `
      : `
                Greetings from Akku ka chasma. We are glad that you chose us. Please verify your account to access the website.
        `;

    await this.mailService.sendEmail({
      to: email,
      body: bodyHTML,
      closure: 'Thanks and regards',
      ctaLabel: 'Click to verify',
      href: href,
      subject: 'Account Email Verification',
      template_name: 'primary',
    });
  }

  async verifyEmail(email: string, user_id: number) {
    await this.prisma.user.update({
      where: { id: user_id, email },
      data: { email_verified: dayjs().format() },
    });
  }

  async getValidUser(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { credentials: true },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    if (user.role !== 'admin' && !user.email_verified) {
      throw new BadRequestException({
        success: false,
        message:
          'Please verify your email by following the link sent to you at your email address.',
      });
    }

    const passwordCorrect = await compareString(
      loginDto.password,
      user.credentials?.password || '',
    );

    if (!passwordCorrect) {
      throw new BadRequestException('Invalid credentials');
    }

    if (user.credentials) {
      // @ts-expect-error credentials should be reomved
      delete user.credentials;
    }

    return user;
  }

  async resetPassword({ data, id, prisma = this.prisma }: IResetPassword) {
    await prisma.credentials.update({
      where: { user_id: id },
      data: {
        password: await hashString(data.new_password),
      },
    });
  }
}
