import { BadRequestException, Injectable } from '@nestjs/common';
import {
  IWithTransactionClient,
  PrismaService,
} from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { TokenService } from '../token/token.service';
import { MailService } from '../mail/mail.service';
import { ResetPasswordDto } from './dto/password.dto';
import { DatabaseId } from 'lib/types';
import { UtilService } from 'src/util/util.service';

interface IResetPassword extends IWithTransactionClient {
  data: ResetPasswordDto;
  id: DatabaseId;
  is_owner?: boolean;
}

interface ISendEmailAfterSignup {
  email: string;
  id: DatabaseId;
  resending?: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly mailService: MailService,
    private readonly util: UtilService,
  ) {}

  async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
      include: { avatar: { select: this.prisma.getFileSelection() } },
    });
  }

  async findUserById(id: DatabaseId) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: { avatar: { select: this.prisma.getFileSelection() } },
    });
  }

  async createUser(data: SignupDto) {
    const { credentials, ...rest } = data;
    credentials.password = await this.util.hashString(credentials.password);
    return await this.prisma.user.create({
      data: {
        ...rest,
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
    const token = await this.tokenService.generateToken(
      { id, email: email },
      { expiresIn: '1d' },
    );
    const href = `verify-email?token=${token}&email=${email}`;
    const bodyHTML = resending
      ? `
        Greetings from RakriTech. We are glad that you chose us. This email is sent to you by request; ignore this email if you didn't requested.
        `
      : `
                Greetings from RakriTech. We are glad that you chose us. Please verify your account to access the website.
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
      data: { email_verified: new Date() },
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

    if (user.deleted_at) {
      throw new BadRequestException({
        success: false,
        message: 'Your account has been blocked by the administrator.',
      });
    }

    if (user.type !== 'admin' && !user.email_verified) {
      throw new BadRequestException({
        success: false,
        message:
          'Please verify your email by following the link sent to you at your email address.',
      });
    }

    const passwordCorrect = await this.util.compareString(
      loginDto.password,
      user.credentials?.password || '',
    );

    if (!passwordCorrect) {
      throw new BadRequestException('Invalid credentials');
    }

    // @ts-expect-error No need to pass credentials to the client
    delete user.credentials;
    return user;
  }

  async resetPassword({ data, id, prisma }: IResetPassword) {
    const PRISMA = prisma || this.prisma;
    await PRISMA.credential.update({
      where: { user_id: id },
      data: {
        password: await this.util.hashString(data.new_password),
      },
    });
  }
}
