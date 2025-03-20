import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [PrismaModule, CacheModule],
  providers: [TokenService],
  exports: [TokenService],
})
export class TokenModule {}
