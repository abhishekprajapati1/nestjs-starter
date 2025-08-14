import { SetMetadata } from '@nestjs/common';
export const PUBLIC_KEY = 'isPublic';
export const PublicApi = () => SetMetadata(PUBLIC_KEY, true);
