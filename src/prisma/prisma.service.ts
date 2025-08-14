import { Injectable } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

export interface IWithTransactionClient {
  prisma?: Prisma.TransactionClient;
}
export interface ITransferEmployees {
  source_id: string;
  target_id: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
export interface PaginatedResponse extends ApiResponse {
  page: number;
  page_size: number;
  total: number;
}

@Injectable()
export class PrismaService extends PrismaClient {
  getFileSelection(): Prisma.FileSelect {
    return {
      id: true,
      key: true,
      url: true,
      fieldname: true,
    };
  }

  /**
      Returns a WhereInput object containing the condition to check if a column is null ( MongoDB specific ).
    */
  getNullFilter<T>(fieldname: string): T {
    const filter = {
      OR: [
        {
          [fieldname]: null,
        },
        {
          [fieldname]: {
            isSet: false,
          },
        },
      ],
    };

    return filter as T;
  }
}
