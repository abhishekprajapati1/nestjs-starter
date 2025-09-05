import { ConfigService } from '@nestjs/config';
import {
  AdapterGetFileResponse,
  AdapterRemoveResponse,
  StorageAdapter,
  UploadedFile,
  UploadOptions,
} from './storage.types';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export class S3StorageAdapter implements StorageAdapter {
  private s3Client: S3Client;
  private bucketName: string;
  private bucketRegion: string;

  constructor(private readonly config: ConfigService) {
    this.s3Client = new S3Client({
      region: config.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY') || '',
        secretAccessKey: config.get<string>('AWS_SECRET_KEY') || '',
      },
    });
    this.bucketName = config.get<string>('AWS_BUCKET_NAME') || '';
    this.bucketRegion = config.get<string>('AWS_REGION') || '';
  }

  async upload(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<UploadedFile> {
    const { key } = options;

    const body = file.buffer;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentDisposition: options?.contentDisposition,
        ContentType: file.mimetype,
      }),
    );

    return {
      url: `https://s3.${this.bucketRegion}.amazonaws.com/${this.bucketName}/${key}`,
      fieldname: file.fieldname,
      key: key,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async remove(key: string): Promise<AdapterRemoveResponse> {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }),
    );
    return { success: true, message: `${key} deleted successfully.` };
  }

  async getFile(key: string): Promise<AdapterGetFileResponse | null> {
    try {
      const { Body, ContentType } = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      if (!Body) return null;
      const contentType = ContentType || 'application/octet-stream';

      return {
        stream: Body as Readable,
        contentType,
      };
    } catch (err) {
      console.error('S3 getFile error:', err);
      return null;
    }
  }
}
