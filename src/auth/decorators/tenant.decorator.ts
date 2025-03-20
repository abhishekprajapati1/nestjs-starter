import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';

export interface ITenant {
  email: string;
  id: number;
  role: UserRole;
  created_at: Date;
}

export interface RequestWithTenant extends Request {
  user: ITenant;
}

export const Tenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ITenant => {
    const request: RequestWithTenant = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
