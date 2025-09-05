import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "./storage.service";

@Injectable()
export class StorageCrons {
  private readonly logger = new Logger(StorageCrons.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanTempFiles() {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    try {
      const files = await this.prisma.file.findMany({
        where: {
          is_temp: true,
          created_at: {
            lte: twentyFourHoursAgo,
          },
        },
      });
      await this.prisma.$transaction(async (prisma) => {
        await prisma.file.deleteMany({
          where: {
            is_temp: true,
            created_at: {
              lte: twentyFourHoursAgo,
            },
          },
        });
        await Promise.all(
          files.map((file) => this.storageService.remove(file.key)),
        );
      });
    } catch (error) {
      this.logger.log(
        "Error while cleaning expired blacklisted tokens " + error,
      );
    }
  }
}
