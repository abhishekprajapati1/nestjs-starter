import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { BucketService } from '../bucket/bucket.service';

@Injectable()
export class FileCrons {
  private readonly logger = new Logger(FileCrons.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bucketService: BucketService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanTempFiles() {
    try {
      const temp_files = await this.prisma.file.findMany({
        where: {
          is_temp: true,
          created_at: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });
      await this.prisma.$transaction(async (prisma) => {
        await prisma.file.deleteMany({
          where: {
            id: {
              in: temp_files.map((file) => file.id),
            },
          },
        });
        await this.bucketService.removeMany(temp_files.map((file) => file.key));
      });
    } catch (error) {
      this.logger.log('Error while cleaning temporary file uploads', error);
    }
  }
}
