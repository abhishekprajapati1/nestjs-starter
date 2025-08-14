import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  HeadBucketCommand,
  ListBucketsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface IUploadWithoutMulter {
  name: string;
  buffer: Buffer;
  contentDisposition?: string;
  mimetype: string;
  fieldname: string;
  size: number;
  isPublic?: boolean;
}

@Injectable()
export class BucketService {
  private s3Client: S3Client;
  private bucketName: string;
  private bucketRegion: string;
  private logger: Logger;
  constructor(private readonly config: ConfigService) {
    this.logger = new Logger(BucketService.name);
    this.s3Client = new S3Client({
      region: this.config.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.get<string>('AWS_ACCESS_KEY') || '',
        secretAccessKey: this.config.get<string>('AWS_SECRET_KEY') || '',
      },
    });

    this.bucketName = this.config.get<string>('AWS_BUCKET_NAME') || '';
    this.bucketRegion = this.config.get<string>('AWS_REGION') || '';
  }

  async upload(
    file: Express.Multer.File,
    contentDisposition: string = 'inline',
    isPublic: boolean = true,
  ) {
    const key =
      process.env.DEV_ENVIRONMENT === 'true'
        ? `development/${Date.now()}_${file.originalname}`
        : `${isPublic ? 'public' : 'protected'}/${Date.now()}_${file.originalname}`;

    const body = file.buffer;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentDisposition: contentDisposition,
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

  async uploadWithoutMulter({
    buffer,
    name,
    mimetype,
    fieldname,
    size = 0,
    contentDisposition = 'inline',
    isPublic = true,
  }: IUploadWithoutMulter) {
    const key =
      process.env.DEV_ENVIRONMENT === 'true'
        ? `development/${Date.now()}_${name}`
        : `${isPublic ? 'public' : 'protected'}/${Date.now()}_${name}`;
    const body = buffer;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentDisposition: contentDisposition,
        ContentType: mimetype,
      }),
    );

    return {
      url: `https://s3.${this.bucketRegion}.amazonaws.com/${this.bucketName}/${key}`,
      fieldname: fieldname,
      key: key,
      size: size,
      mimetype: mimetype,
    };
  }

  async remove(key: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }),
    );
    return { success: true, message: `${key} deleted successfully.` };
  }

  async uploadMany(
    files: Express.Multer.File[],
    contentDisposition = 'inline',
  ) {
    const uploadPromises: Array<
      Promise<{
        url: string;
        fieldname: string;
        key: string;
        size: number;
        mimetype: string;
      }>
    > = [];

    files.forEach((file) => {
      uploadPromises.push(this.upload(file, contentDisposition));
    });

    const urls = await Promise.all(uploadPromises);
    return urls;
  }

  async removeMany(keys: string[] = []) {
    const removePromises: Array<
      Promise<{
        success: boolean;
        message: string;
      }>
    > = [];
    keys.forEach((key: string) => {
      removePromises.push(this.remove(key));
    });

    await Promise.all(removePromises);
  }

  async download(key: string): Promise<GetObjectCommandOutput> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      return response;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async checkBucketConnectivity() {
    const result = await this.s3Client.send(
      new HeadBucketCommand({ Bucket: this.bucketName }),
    );
    return result;
  }
}
