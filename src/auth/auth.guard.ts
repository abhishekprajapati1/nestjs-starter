import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { TOKENS } from 'lib/constants';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from 'src/token/token.service';
import { PUBLIC_KEY } from './decorators/public.decorator';
import { ITenant } from './decorators/tenant.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private logger: Logger;
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {
    this.logger = new Logger(AuthGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    //eslint-disable-next-line
    const request = context.switchToHttp().getRequest();
    //eslint-disable-next-line
    const token = this.extractTokenFromHeader(request);

    // If route is public, allow it no matter what
    if (isPublic) {
      // But still try to attach user if token is present
      if (token) {
        //eslint-disable-next-line
        await this.attachUserIfValid(request, token);
      }
      return true;
    }

    // For protected routes, token must be valid
    if (!token) {
      throw new UnauthorizedException({
        success: false,
        message: 'Authentication token not found.',
      });
    }

    //eslint-disable-next-line
    await this.attachUserIfValid(request, token, true);
    return true;
  }

  private async attachUserIfValid(
    request: Request,
    token: string,
    strict = false, // if true, throw on failure
  ) {
    try {
      const payload = await this.tokenService.verifyToken<ITenant>(token);
      if (!payload?.id) throw new Error('Invalid token payload');

      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
      });

      if (!user) throw new Error('User not found');

      request['user'] = user; // or payload, if that's what you store
    } catch (error) {
      this.logger.log(error);
      if (strict) {
        throw new UnauthorizedException('Access denied!!');
      }
      // If not strict (i.e. public route), silently skip attaching
    }
  }

  private extractTokenFromHeader(request: Request): string | null {
    try {
      return (
        (request.cookies[TOKENS.auth_token] as string) ||
        request.headers['authorization']?.split(' ')[1] ||
        null
      );
    } catch {
      return null;
    }
  }
}
