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
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import {
  ResendEmailVerificationLinkDto,
  ResendOtpDto,
  SignupDto,
  VerifyOtpDto,
} from "./dto/signup.dto";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { LoginDto } from "./dto/login.dto";
import { Response } from "express";
import { PublicApi } from "./decorators/public.decorator";
import { MailService } from "../mail/mail.service";
import { TokenService } from "../token/token.service";
import { TokenDto } from "../token/dto/token.dto";
import { RefreshTokenDto } from "./dto/refresh.dto";
import {
  ERR_TYPES,
  MAX_AGES,
  TOKENS,
  TOKEN_DATA,
  TOKEN_EXPIRATIONS,
  TokensType,
} from "../../lib/constants";
import { ITenant, Tenant } from "./decorators/tenant.decorator";
import { Tokens } from "../token/decorators/tokens.decorator";
import { ApiResponse, PrismaService } from "../prisma/prisma.service";
import { ForgotPasswordDto, ResetPasswordDto } from "./dto/password.dto";
import { UserTypes } from "@prisma/client";
import { DatabaseId } from "lib/types";
import { UtilService } from "src/util/util.service";
import { OtpService } from "src/otp/otp.service";

@Controller("auth")
@ApiTags("Authentication")
export class AuthController {
  private logger: Logger;
  constructor(
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly otpService: OtpService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
    private readonly util: UtilService,
  ) {
    this.logger = new Logger(AuthController.name);
  }

  @PublicApi()
  @Post("signup")
  @ApiOperation({
    description: "Creates a new user account.",
  })
  async signup(@Body() signupDto: SignupDto) {
    const exist = await this.authService.findUserByEmail(signupDto.email);
    if (exist)
      throw new BadRequestException(
        "An account already exists with same email. Please login.",
      );

    const created = await this.authService.createUser(signupDto);
    if (created) {
      const otp = await this.otpService.generateOtp({
        email: created.email,
        user_id: created.id,
      });

      // TODO: send email/SMS with otp.digits
      const bodyHTML = `
    Greetings from Trackor. Here is is your one time password - ${otp.digits}; ignore this email if you didn't requested. The code is only valid for next 10 minutes
    `;

      if (created.email) {
        await this.mailService.sendEmail({
          to: created.email,
          body: bodyHTML,
          closure: "Thanks and regards",
          subject: "Account Email Verification",
          template_name: "plain",
        });
      }
    }

    return {
      success: true,
      message:
        "An OTP is sent to your email address.",
    };
  }

  @PublicApi()
  @Post("verify-otp")
  @ApiOperation({ description: "Use this api to verify otps" })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<ApiResponse> {
    const verified = await this.otpService.verifyOtp({
      digits: verifyOtpDto.otp,
      email: verifyOtpDto.email,
      phone: verifyOtpDto.phone,
    });
    if (!verified) {
      throw new BadRequestException("OTP verification was failed.");
    }

    await this.prisma.user.update({
      where: { email: verifyOtpDto.email },
      data: {
        email_verified: new Date(),
      },
    });

    return { success: true, message: "OTP verified successfully." };
  }

  @PublicApi()
  @Post("resend-otp")
  @ApiOperation({ description: "Use this api to resend the otp." })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto): Promise<ApiResponse> {
    if (!resendOtpDto.email && !resendOtpDto.phone) {
      throw new BadRequestException("Either email or phone is required.");
    }
    const user = await this.prisma.user.findUnique({
      where: { email: resendOtpDto.email },
    });
    if (!user) {
      throw new BadRequestException("User couldn't be found with the email");
    }

    const otp = await this.otpService.generateOtp({
      email: resendOtpDto.email,
      phone: resendOtpDto.phone,
      context: "email_verification",
    });

    const bodyHTML = `
      Greetings from Trackor. Here is is your one time password - ${otp.digits}; ignore this email if you didn't requested. The code is only valid for next 10 minutes
      `;

    if (user.email) {
      await this.mailService.sendEmail({
        to: user.email,
        body: bodyHTML,
        closure: "Thanks and regards",
        subject: "Account Email Verification",
        template_name: "plain",
      });
    }

    return { success: true, message: "OTP sent sucessfully." };
  }

  @PublicApi()
  @Post("verfiy-email")
  @ApiOperation({
    description: `This API endpoint is used to verify a user's email by providing the token sent to their registered email ID during the signup process. Successful verification is required for users to proceed with the login process.`,
  })
  async verifyEmail(@Query() verifyEmailDto: TokenDto) {
    const payload = await this.tokenService.verifyToken<{
      id: DatabaseId;
      email: string;
    }>(verifyEmailDto.token);
    if (!payload)
      throw new UnauthorizedException({
        success: false,
        message:
          "Verification link is expired. Please request another verification link.",
        type: ERR_TYPES.token_expired,
      });

    const user = await this.authService.findUserByEmail(payload.email);
    if (!user)
      throw new NotFoundException({
        success: false,
        message: "Verification failed no user exist with this email address.",
        type: ERR_TYPES.token_invalid,
      });

    if (user.email_verified) {
      throw new BadRequestException({
        success: true,
        message: "Email is already verified. You can close this page.",
        type: ERR_TYPES.already_verified,
      });
    }

    await this.authService.verifyEmail(user.email, user.id);

    return { success: true, message: "Email successfully verified." };
  }

  @PublicApi()
  @Post("resend-verification-link")
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
        message: "The user does not exist.",
      });
    if (user.email_verified)
      throw new BadRequestException("The eamil is already verified.");
    await this.authService.sendEmailAfterSignup({
      email: user.email,
      id: user.id,
      resending: true,
    });

    return { success: true, message: "Verification link sent to your email." };
  }

  @PublicApi()
  @Post("signin")
  async signin(@Body() loginDto: LoginDto, @Res() response: Response) {
    const user = await this.authService.getValidUser(loginDto);

    const tokenPayload: ITenant = {
      id: user.id,
      email: user.email,
      type: user.type || UserTypes.interviewer,
      created_at: user?.created_at || new Date(),
    };

    const refreshTokenPayload = {
      type: TOKENS.refresh_token,
      data: tokenPayload,
    };

    // providing auth token
    const auth_token = await this.tokenService.generateToken(tokenPayload, {
      expiresIn: loginDto.remember_me
        ? "15d"
        : TOKEN_EXPIRATIONS[TOKENS.auth_token],
    });

    const auth_token_age = loginDto.remember_me
      ? 1000 * 60 * 60 * 24 * 15
      : MAX_AGES[TOKENS.auth_token];

    this.util.setCookie(response, {
      data: auth_token,
      name: TOKENS.auth_token,
      age: auth_token_age,
    });

    // providing refresh token
    const refreshToken = await this.tokenService.generateToken(
      refreshTokenPayload,
      {
        expiresIn: TOKEN_EXPIRATIONS[TOKENS.refresh_token],
      },
    );
    this.util.setCookie(response, {
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
      message: "Logged in successfully.",
    });
  }

  @Get("/details")
  async getLoggedUserDetails(@Tenant() tenant: ITenant) {
    const details = await this.authService.findUserByEmail(tenant.email);
    return { success: true, data: details };
  }

  @PublicApi()
  @Post("/forgot")
  async sendForgotEmail(@Body() forgotDto: ForgotPasswordDto) {
    const user = await this.authService.findUserByEmail(forgotDto.email);

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: "User does not exists.",
      });
    }

    const token = await this.tokenService.generateToken(
      { id: user.id, type: user.type, email: user.email },
      {
        expiresIn: "48h",
      },
    );
    const htmlBody = `
            <p>Hi ${user.name},</p>
            <p>Please click the link below to reset your password. If you did not make this request, please ignore this email. This link is valid for 48 hours.</p>
        `;
    const href = `reset-password?token=${token}`;
    try {
      await this.mailService.sendEmail({
        to: forgotDto.email,
        body: htmlBody,
        closure: "Thanks and regards",
        ctaLabel: `Reset Password`,
        href,
        subject: `Reset Password`,
        template_name: "primary",
      });
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        message:
          (error as { message?: string })?.message || "Something went wrong.",
      });
    }

    return {
      success: true,
      data: { email: forgotDto.email },
      message: `A password reset link is sent to your email address.`,
    };
  }

  @PublicApi()
  @Put("/reset-password")
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Query() tokenDto: TokenDto,
  ) {
    // check for authenticity of token
    const tokenBlacklisted = await this.tokenService.findToken({
      token: tokenDto.token,
    });

    if (tokenBlacklisted)
      throw new BadRequestException({
        success: false,
        message:
          "The link has been used kindly request again for resetting your password.",
      });

    // extract data from token
    const payload = await this.tokenService.verifyToken<{
      id: DatabaseId;
      type: UserTypes;
      email: string;
      iat: number;
      exp: number;
    }>(tokenDto.token);
    if (!payload)
      throw new UnauthorizedException({
        success: false,
        message:
          "Reset password link is expired. Please request another reset link.",
      });

    const { id, iat, exp } = payload;

    const user = await this.authService.findUserById(id);
    if (!user) {
      throw new NotFoundException({
        success: false,
        message: "Owner does not exist.",
      });
    }

    await this.prisma.$transaction(
      async (prisma) => {
        await this.authService.resetPassword({
          data: resetPasswordDto,
          id,
          prisma,
        });
        await this.tokenService.blacklistToken({
          token: tokenDto.token,
          iat,
          exp,
          prisma,
        });
      },
      { timeout: 20000, maxWait: 5000 },
    );

    return { success: true, message: "Password reset successfully." };
  }

  @Get("refresh-token")
  async refreshToken(
    @Query() refreshTokenDto: RefreshTokenDto,
    @Tokens() tokens: TokensType,
    @Tenant() tenant: ITenant,
    @Res() response: Response,
  ) {
    if (!tokens[TOKENS.refresh_token])
      throw new UnauthorizedException({
        success: false,
        message: "Refresh token not found",
      });
    const refreshPayload = await this.tokenService.getRefreshPayload(
      tokens[TOKENS.refresh_token] as string,
      tenant.id,
    );

    const new_token: TOKEN_DATA = {};

    if (refreshTokenDto.type === TOKENS.auth_token) {
      new_token.value = await this.tokenService.generateToken(
        refreshPayload.data,
      );
      new_token.life = Date.now() + MAX_AGES[TOKENS.auth_token];
      new_token.type = TOKENS.auth_token;
      this.util.setCookie(response, {
        data: new_token.value,
        name: TOKENS.auth_token,
      });
    }

    const new_refresh_token = this.tokenService.generateToken(
      { type: TOKENS.refresh_token, data: refreshPayload.data },
      { expiresIn: TOKEN_EXPIRATIONS[TOKENS.refresh_token] },
    );
    this.util.setCookie(response, {
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

  @Delete("logout")
  @ApiOperation({
    description: "Used to delete the session. Only works with web browsers.",
  })
  async logout(@Tokens() tokens: TokensType, @Res() response: Response) {
    for (const token in tokens) {
      this.util.removeCookie(response, token);
      try {
        const decoded = await this.tokenService.verifyToken<{
          iat: number;
          exp: number;
        }>(tokens[token] as string);
        if (decoded) {
          await this.tokenService.blacklistToken({
            token: tokens[token] as string,
            iat: decoded.iat,
            exp: decoded.exp,
          });
        }
      } catch (error) {
        this.logger.error(
          "Error while blacklisting tokens " + error,
          "AuthController",
        );
      }
    }
    return response
      .status(HttpStatus.OK)
      .json({ success: true, message: "Successfully logged out." });
  }
}
