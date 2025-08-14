import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { UserTypes } from '@prisma/client';

export interface ITenant {
  email: string;
  id: number;
  type: UserTypes;
  created_at: Date;
}

export const Tenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    //eslint-disable-next-line
    const request = ctx.switchToHttp().getRequest();
    //eslint-disable-next-line
    return request.user;
  },
);
