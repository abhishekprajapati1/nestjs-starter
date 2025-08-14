import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ERR_TYPES, TOKENS, TOKEN_EXPIRATIONS } from '../../lib/constants';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  IWithTransactionClient,
  PrismaService,
} from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { IRefreshTokenPayload } from 'lib/types';

interface IBlacklistToken extends IWithTransactionClient {
  token: string;
  iat: number;
  exp: number;
}
interface IFindToken extends IWithTransactionClient {
  token: string;
}

@Injectable()
export class TokenService {
  logger: Logger;
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.logger = new Logger(TokenService.name);
  }

  async verifyToken<T extends object>(token: string) {
    try {
      return await this.jwt.verifyAsync<T>(token, {
        secret: this.config.get<string>('SECRET_KEY'),
      });
    } catch (error) {
      this.logger.error(error, 'error');
      throw new BadRequestException({
        success: false,
        message: 'Invalid token.',
        type: ERR_TYPES.token_invalid,
      });
    }
  }

  async generateToken<T extends object = any>(
    payload: T,
    options?: JwtSignOptions,
  ) {
    return await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('SECRET_KEY'),
      expiresIn: TOKEN_EXPIRATIONS[TOKENS.auth_token],
      ...(options && options),
    });
  }

  async getRefreshPayload(refresh_token: string, id: number) {
    const payload = await this.verifyToken<IRefreshTokenPayload>(refresh_token);
    if (payload.type !== TOKENS.refresh_token)
      throw new UnauthorizedException({
        success: false,
        message: 'Refresh token is not valid.',
      });
    if (payload.data.id !== id)
      throw new UnauthorizedException({
        success: false,
        message: 'Invalid user requesting refresh action.',
      });
    return payload;
  }

  async findToken({ token, prisma }: IFindToken) {
    const PRISMA = prisma || this.prisma;
    return await PRISMA.token.findUnique({ where: { token } });
  }

  async blacklistToken({ token, iat, exp, prisma }: IBlacklistToken) {
    const PRISMA = prisma || this.prisma;

    try {
      const tkn = await this.findToken({ token, prisma: PRISMA });
      if (!tkn) {
        await this.prisma.token.create({
          data: {
            token,
            iat,
            exp,
          },
        });
      }
    } catch (error) {
      this.logger.log(error);
    }
  }
}
