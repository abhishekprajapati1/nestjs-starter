import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BucketModule } from '../bucket/bucket.module';
import { FileCrons } from './file.crons';

@Module({
  imports: [PrismaModule, BucketModule],
  controllers: [FileController],
  providers: [FileService, FileCrons],
  exports: [FileService],
})
export class FileModule {}
