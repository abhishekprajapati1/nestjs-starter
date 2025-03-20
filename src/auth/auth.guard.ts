import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PUBLIC_KEY } from './decorators/public.decorator';
import { TOKENS } from '../../lib/constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request: Request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException({
        success: false,
        message: 'Authentication secret not found.',
      });
    }

    try {
      const payload = this.tokenService.verifyToken(token);

      if (!payload)
        throw new BadRequestException({
          success: false,
          message: 'Access denied !!',
        });

      const exist = await this.prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (!exist)
        throw new UnauthorizedException({
          success: false,
          message: 'Access denied !!',
        });

      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException({
        success: false,
        message: 'Access denied !!',
        error: error as Error,
      });
    }

    return true;
  }

  extractTokenFromHeader(request: Request): string | null {
    try {
      return ((request.cookies as object)?.[TOKENS.auth_token] ||
        request.headers?.authorization?.split(' ')[1]) as string;
    } catch (error) {
      Logger.error(error, 'AuthGuard');
      return null;
    }
  }
}
