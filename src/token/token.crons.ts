import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TokenCrons {
  private readonly logger = new Logger(TokenCrons.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanBlackListedTokens() {
    try {
      await this.prisma.token.deleteMany({
        where: {
          exp: {
            lte: Date.now(),
          },
        },
      });
    } catch (error) {
      this.logger.log(
        'Error while cleaning expired blacklisted tokens ' + error,
      );
    }
  }
}
