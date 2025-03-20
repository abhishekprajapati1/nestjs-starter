import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaHelpers {
  getFileSelection(options?: Prisma.FileSelect) {
    const select: Prisma.FileSelect = {
      id: true,
      url: true,
      ...(options && options),
    };
    return select;
  }
}
