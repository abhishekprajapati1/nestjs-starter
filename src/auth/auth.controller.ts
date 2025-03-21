import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Post,
  Put,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResendEmailVerificationLinkDto, SignupDto } from './dto/signup.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { PublicApi } from './decorators/public.decorator';
import { MailService } from '../mail/mail.service';
import { RefreshTokenPayload, TokenService } from '../token/token.service';
import { TokenDto } from '../token/dto/token.dto';
import { RefreshTokenDto } from './dto/refresh.dto';
import {
  ERR_TYPES,
  MAX_AGES,
  TOKENS,
  TOKEN_DATA,
  TOKEN_EXPIRATIONS,
  TokensType,
} from '../../lib/constants';
import { ITenant, Tenant } from './decorators/tenant.decorator';
import { removeCookie, setCookie } from '../../lib/utils';
import { Tokens } from '../token/decorators/tokens.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { CacheService } from 'src/cache/cache.service';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  @PublicApi()
  @Post('signup')
  @ApiOperation({
    description: 'Creates a new user account.',
  })
  async signup(@Body() signupDto: SignupDto) {
    const exist = await this.authService.findUserByEmail(signupDto.email);
    if (exist)
      throw new BadRequestException(
        'An account already exists with same email. Please login.',
      );

    const created = await this.authService.createUser(signupDto);
    if (created)
      await this.authService.sendEmailAfterSignup({
        email: created.email,
        id: created.id,
      });

    return {
      success: true,
      message:
        'Registration successful. Verify your email by clicking the link sent to your email address.',
    };
  }

  @PublicApi()
  @Post('verfiy-email')
  @ApiOperation({
    description: `This API endpoint is used to verify a user's email by providing the token sent to their registered email ID during the signup process. Successful verification is required for users to proceed with the login process.`,
  })
  async verifyEmail(@Query() verifyEmailDto: TokenDto) {
    const payload = this.tokenService.verifyToken(verifyEmailDto.token);
    if (!payload)
      throw new UnauthorizedException({
        success: false,
        message:
          'Verification link is expired. Please request another verification link.',
        type: ERR_TYPES.token_expired,
      });

    const user = await this.authService.findUserByEmail(payload.email);
    if (!user)
      throw new NotFoundException({
        success: false,
        message: 'Verification failed no user exist with this email address.',
        type: ERR_TYPES.token_invalid,
      });

    if (user.email_verified) {
      throw new BadRequestException({
        success: true,
        message: 'Email is already verified. You can close this page.',
        type: ERR_TYPES.already_verified,
      });
    }

    await this.authService.verifyEmail(user.email, user.id);

    return { success: true, message: 'Email successfully verified.' };
  }

  @PublicApi()
  @Post('resend-verification-link')
  @ApiOperation({
    description: `Resends the email verification link to the user to the given email address.`,
  })
  async resendEmailVerificationLink(
    @Body() resendEmailVerificationLinkDto: ResendEmailVerificationLinkDto,
  ) {
    const user = await this.authService.findUserByEmail(
      resendEmailVerificationLinkDto.email,
    );
    if (!user)
      throw new BadRequestException({
        success: false,
        message: 'The user does not exist.',
      });
    if (user.email_verified)
      throw new BadRequestException('The eamil is already verified.');
    await this.authService.sendEmailAfterSignup({
      email: user.email,
      id: user.id,
      resending: true,
    });

    return { success: true, message: 'Verification link sent to your email.' };
  }

  @PublicApi()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() response: Response) {
    const user = await this.authService.getValidUser(loginDto);

    const tokenPayload: ITenant = {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    };

    const refreshTokenPayload: RefreshTokenPayload<ITenant> = {
      type: TOKENS.refresh_token as keyof TokensType,
      data: tokenPayload,
    };

    // providing auth token
    const auth_token = this.tokenService.generateToken(tokenPayload, {
      expiresIn: loginDto.remember_me
        ? '15D'
        : TOKEN_EXPIRATIONS[TOKENS.auth_token],
    });

    const auth_token_age = loginDto.remember_me
      ? 1000 * 60 * 60 * 24 * 15
      : MAX_AGES[TOKENS.auth_token];

    setCookie(response, {
      data: auth_token,
      name: TOKENS.auth_token,
      age: auth_token_age,
    });

    // providing refresh token
    const refreshToken = this.tokenService.generateToken(refreshTokenPayload, {
      expiresIn: TOKEN_EXPIRATIONS[TOKENS.refresh_token],
    });
    setCookie(response, {
      data: refreshToken,
      name: TOKENS.refresh_token,
      age: MAX_AGES[TOKENS.refresh_token],
    });

    return response.status(HttpStatus.OK).json({
      success: true,
      data: {
        auth_token: {
          value: auth_token,
          type: TOKENS.auth_token,
          life: Date.now() + auth_token_age,
        },
        refresh_token: refreshToken,
      },
      message: 'Logged in successfully.',
    });
  }

  @Get('/details')
  async getLoggedUserDetails(@Tenant() tenant: ITenant) {
    const details = await this.authService.findUserByEmail(tenant.email);
    return { success: true, data: details };
  }

  @PublicApi()
  @Post('/forgot')
  async sendForgotEmail(@Body() forgotDto: ForgotPasswordDto) {
    const user = await this.authService.findUserByEmail(forgotDto.email);

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User does not exists.',
      });
    }

    const token = this.tokenService.generateToken(user, { expiresIn: '48h' });
    const htmlBody = `
            <p>Hi ${user.name},</p>
            <p>Please click the link below to reset your password. If you did not make this request, please ignore this email. This link is valid for 48 hours.</p>
        `;
    const href = `reset-password?token=${token}`;
    try {
      await this.mailService.sendEmail({
        to: forgotDto.email,
        body: htmlBody,
        closure: 'Thanks and regards',
        ctaLabel: `Reset Password`,
        href,
        subject: `Reset Password`,
        template_name: 'primary',
      });
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message: 'Something went wrong.',
        error: error as Error,
      });
    }

    return {
      success: true,
      data: { email: forgotDto.email },
      message: `A password reset link is sent to your email address.`,
    };
  }

  @PublicApi()
  @Put('/reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Query() tokenDto: TokenDto,
  ) {
    // check for authenticity of token
    const tokenBlacklisted = await this.tokenService.findToken(tokenDto.token);

    if (tokenBlacklisted)
      throw new BadRequestException({
        success: false,
        message:
          'The link has been used kindly request again for resetting your password.',
      });

    // extract data from token
    const payload = this.tokenService.verifyToken(tokenDto.token);
    if (!payload)
      throw new UnauthorizedException({
        success: false,
        message:
          'Reset password link is expired. Please request another reset link.',
      });

    const { id } = payload || {};

    const user = await this.authService.findUserById(id);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'User does not exist.',
      });
    }

    await this.prisma.$transaction(
      async (prisma) => {
        await this.authService.resetPassword({
          data: resetPasswordDto,
          id: id,
          prisma,
        });

        // set the token in cache.
        await this.cacheService.set(tokenDto.token, tokenDto.token);
      },
      { timeout: 20000, maxWait: 5000 },
    );

    return { success: true, message: 'Password reset successfully.' };
  }

  @Get('refresh-token')
  refreshToken(
    @Query() refreshTokenDto: RefreshTokenDto,
    @Tokens() tokens: TokensType,
    @Tenant() tenant: ITenant,
    @Res() response: Response,
  ) {
    if (!tokens[TOKENS.refresh_token])
      throw new UnauthorizedException({
        success: false,
        message: 'Refresh token not found',
      });
    const refreshPayload = this.tokenService.getRefreshPayload(
      tokens[TOKENS.refresh_token] as string,
      tenant.id,
    );

    const new_token: TOKEN_DATA = {};

    if (refreshTokenDto.type === TOKENS.auth_token) {
      new_token.value = this.tokenService.generateToken(refreshPayload.data);
      new_token.life = Date.now() + MAX_AGES[TOKENS.auth_token];
      new_token.type = TOKENS.auth_token;
      setCookie(response, { data: new_token.value, name: TOKENS.auth_token });
    }

    const new_refresh_token = this.tokenService.generateToken(
      { type: TOKENS.refresh_token, data: refreshPayload.data },
      { expiresIn: TOKEN_EXPIRATIONS[TOKENS.refresh_token] },
    );
    setCookie(response, {
      name: TOKENS.refresh_token,
      data: new_refresh_token,
      age: MAX_AGES[TOKENS.refresh_token],
    });

    response.status(HttpStatus.OK).json({
      success: true,
      data: {
        new_token: new_token,
        refresh_token: new_refresh_token,
      },
    });
  }

  @Delete('logout')
  @ApiOperation({
    description: 'Used to delete the session. Only works with web browsers.',
  })
  async logout(@Tokens() tokens: TokensType, @Res() response: Response) {
    for (const token in tokens) {
      removeCookie(response, token);
      try {
        if (tokens[token]) {
          const decoded = this.tokenService.verifyToken(
            tokens[token] as string,
          );
          if (decoded) {
            await this.cacheService.set(token[token] as string, token[token]);
          }
        }
      } catch (error) {
        Logger.log(error, 'AuthController');
      }
    }
    return response
      .status(HttpStatus.OK)
      .json({ success: true, message: 'Successfully logged out.' });
  }
}
