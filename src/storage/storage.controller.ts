import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  StreamableFile,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiResponse as ApiReturnType,
  PrismaService,
} from 'src/prisma/prisma.service';
import { UploadInterceptor } from './interceptors/upload.interceptor';
import { RemoveInterceptor } from './interceptors/remove.interceptor';
import { UploadedFile, Uploads as UploadsType } from './storage.types';
import { Uploads } from './decorators/uploads.decorator';
import { Upload } from './decorators/upload.decorator';
import { StorageService } from './storage.service';
import { PublicApi } from 'src/auth/decorators/public.decorator';


@ApiTags("Storage Management")
@Controller('storage')
export class StorageController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) { }

  @Post()
  @UseInterceptors(
    AnyFilesInterceptor({ limits: { fileSize: 1024 * 1024 * 5, files: 10 } }),
    UploadInterceptor,
    RemoveInterceptor,
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload files',
    description: 'Upload one or multiple files',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['files'], // This makes the files field required
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  async uploadMany(
    @Uploads() uploads: UploadsType,
    @Upload() upload: UploadedFile,
  ): Promise<ApiReturnType> {
    if (!uploads && !upload) {
      throw new BadRequestException('Please select file(s) to upload.');
    } else if (Array.isArray(uploads) && uploads.length < 1) {
      throw new BadRequestException('Please select file(s) to upload.');
    }
    let files: Array<unknown> = [];

    if (Array.isArray(uploads)) {
      files = await Promise.all(
        uploads.map((file) =>
          this.prisma.file.create({
            data: this.prisma.getFilePayload(file),
          }),
        ),
      );
    } else if (upload) {
      files = await Promise.all(
        [upload].map((file) =>
          this.prisma.file.create({
            data: this.prisma.getFilePayload(file),
          }),
        ),
      );
    } else {
      let createPromises: Array<unknown> = [];
      for (const upload in uploads) {
        createPromises = [
          ...createPromises,
          ...uploads[upload].map((file) =>
            this.prisma.file.create({
              data: this.prisma.getFilePayload(file),
            }),
          ),
        ];
      }
      files = await Promise.all(createPromises);
    }

    return {
      success: true,
      data: files,
      message: 'File uploaded successfully',
    };
  }

  @Get(':key')
  @PublicApi()
  async getFile(@Param('key') key: string) {
    const file = await this.storageService.getFile(key);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    return new StreamableFile(file.stream, {
      type: file.contentType,
    });
  }
}
