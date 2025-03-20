import {
  BadRequestException,
  Controller,
  Delete,
  NotFoundException,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { BucketService } from '../bucket/bucket.service';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { FileUploadInterceptor } from '../bucket/file-upload.interceptor';
import { FileRemovalInterceptor } from '../bucket/file-removal.interceptor';
import {
  BucketUploads,
  BucketUploadsType,
} from '../bucket/decorators/bucket-uploads.decorator';
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
} from '../prisma/prisma.service';
import { RequiredIdDto } from '../prisma/dto/common.dto';

@ApiTags('Files')
@Controller('files')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private readonly bucketService: BucketService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseInterceptors(
    AnyFilesInterceptor({ limits: { fileSize: 1024 * 1024 * 5, files: 1 } }),
    new FileUploadInterceptor(new BucketService()),
    new FileRemovalInterceptor(new BucketService()),
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
  async create(
    @BucketUploads() files: BucketUploadsType[],
  ): Promise<ApiReturnType> {
    if (files?.length === 0 || !files) {
      throw new BadRequestException('Please select a file to upload.');
    }
    const file = await this.fileService.create(files[0]);

    return { success: true, data: file, message: 'File uploaded successfully' };
  }

  @Delete(':id')
  async removeFile(@Param() params: RequiredIdDto): Promise<ApiReturnType> {
    const file = await this.fileService.getFileById(params.id);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const removed = await this.prisma.$transaction(
      async (prisma) => {
        const removed = await this.fileService.removeFileById({
          file_id: params.id,
          prisma,
        });

        await this.bucketService.remove(file.key);
        return removed;
      },
      { maxWait: 40000, timeout: 60000 },
    );

    return {
      success: true,
      data: removed,
      message: 'File removed successfully',
    };
  }
}
