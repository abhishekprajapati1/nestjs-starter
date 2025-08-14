import { SetMetadata } from '@nestjs/common';
import { UserTypes } from '@prisma/client';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserTypes[]) => SetMetadata(ROLES_KEY, roles);
