import { Injectable, Logger } from '@nestjs/common';
import {
  IWithTransactionClient,
  PrismaService,
} from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  BucketUploadsType,
  ISingleBucketUpload,
} from '../bucket/decorators/bucket-uploads.decorator';
import { BucketService } from '../bucket/bucket.service';
import { DatabaseIdType } from 'lib/settings';

type FileRelationOmitProperties =
  | 'key'
  | 'mimetype'
  | 'id'
  | 'url'
  | 'fieldname'
  | 'is_temp';
interface IUpsertFile extends IWithTransactionClient {
  file: Prisma.FileCreateInput;
  where: Prisma.FileWhereUniqueInput;
  createRelationInput: Omit<Prisma.FileCreateInput, FileRelationOmitProperties>;
}
interface IRemoveFileById extends IWithTransactionClient {
  file_id: DatabaseIdType;
}
interface ICreateFile extends IWithTransactionClient {
  file: Prisma.FileCreateInput;
  createRelationInput: Omit<Prisma.FileCreateInput, FileRelationOmitProperties>;
}
interface IUpdateFile extends IWithTransactionClient {
  file_id: DatabaseIdType;
  data: Prisma.FileUpdateInput;
}

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bucketService: BucketService,
  ) {}

  /**
   *
   * Creates a new related file.
   */
  async createFile({ file, createRelationInput = {}, prisma }: ICreateFile) {
    const PRISMA = prisma || this.prisma;
    return await PRISMA.file.create({
      data: {
        ...file,
        ...createRelationInput,
      },
    });
  }

  async create(file: BucketUploadsType) {
    return await this.prisma.file.create({
      data: this.getFilePayload(file),
    });
  }

  async getFileById(file_id: DatabaseIdType) {
    return await this.prisma.file.findUnique({
      where: { id: file_id },
    });
  }

  async update({ file_id, data, prisma }: IUpdateFile) {
    const PRISMA = prisma || this.prisma;
    return await PRISMA.file.update({
      where: { id: file_id },
      data,
    });
  }

  async removeFileById({ file_id, prisma }: IRemoveFileById) {
    const PRISMA = prisma || this.prisma;
    return await PRISMA.file.delete({
      where: { id: file_id },
    });
  }

  async upsertFile({
    file,
    where,
    createRelationInput = {},
    prisma,
  }: IUpsertFile) {
    const PRISMA = prisma || this.prisma;
    return await PRISMA.file.upsert({
      where,
      create: {
        ...file,
        ...createRelationInput,
      },
      update: file,
    });
  }

  getFilePayload(bucket_uploads: ISingleBucketUpload): Prisma.FileCreateInput {
    return {
      key: bucket_uploads.key,
      url: bucket_uploads.url,
      mimetype: bucket_uploads.mimetype,
      fieldname: bucket_uploads.fieldname,
    };
  }
}
