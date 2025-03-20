import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import {
  ERR_TYPES,
  TOKENS,
  TOKEN_EXPIRATIONS,
  TokensType,
} from '../../lib/constants';
import { CacheService } from 'src/cache/cache.service';
import { settings } from 'lib/settings';
import { ITenant } from '../auth/decorators/tenant.decorator';

export type RefreshTokenPayload<T> = {
  type: keyof TokensType;
  data: T;
};

@Injectable()
export class TokenService {
  constructor(private readonly cacheService: CacheService) {}

  verifyToken<T = ITenant>(token: string): T {
    try {
      return jwt.verify(token, settings.get<string>('SECRET_KEY')) as T;
    } catch (error) {
      console.log(error, 'error');
      throw new BadRequestException({
        success: false,
        message: 'Invalid token.',
        type: ERR_TYPES.token_invalid,
      });
    }
  }

  generateToken(payload: string | Buffer | object, options?: jwt.SignOptions) {
    return jwt.sign(payload, settings.get<string>('SECRET_KEY'), {
      expiresIn: TOKEN_EXPIRATIONS[TOKENS.auth_token],
      ...(options && options),
    });
  }

  getRefreshPayload(
    refresh_token: string,
    id: number,
  ): RefreshTokenPayload<ITenant> {
    const payload =
      this.verifyToken<RefreshTokenPayload<ITenant>>(refresh_token);
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

  async findToken(token: string) {
    return await this.cacheService.get<string>(token);
  }

  async blacklistToken(token: string) {
    try {
      const tkn = await this.findToken(token);
      if (!tkn) {
        await this.cacheService.set(token, tkn);
      }
    } catch (error) {
      Logger.log(error, 'TokenService');
    }
  }
}
