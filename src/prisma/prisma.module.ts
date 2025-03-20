import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaHelpers } from './prisma.helpers';

@Module({
  providers: [PrismaService, PrismaHelpers],
  exports: [PrismaService, PrismaHelpers],
})
export class PrismaModule {}
