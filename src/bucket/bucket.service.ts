import {
  DeleteObjectCommand,
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { settings } from '../../lib/settings';

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

  constructor() {
    this.s3Client = new S3Client({
      region: settings.get('AWS_REGION'),
      credentials: {
        accessKeyId: settings.get('AWS_ACCESS_KEY'),
        secretAccessKey: settings.get('AWS_SECRET_KEY'),
      },
    });
    this.bucketName = settings.get('AWS_BUCKET_NAME');
    this.bucketRegion = settings.get('AWS_REGION');
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
    const uploadPromises: Promise<{
      url: string;
      fieldname: string;
      key: string;
      mimetype: string;
    }>[] = [];

    files.forEach((file) => {
      uploadPromises.push(
        new Promise((resolve, reject) => {
          try {
            const res = this.upload(file, contentDisposition);
            resolve(res);
          } catch (error) {
            reject(error as Error);
          }
        }),
      );
    });

    const urls = await Promise.all(uploadPromises);
    return urls;
  }

  async removeMany(keys: string[] = []) {
    const removePromises: Promise<{
      success: boolean;
      message: string;
    }>[] = [];

    keys.forEach((key: string) => {
      removePromises.push(
        new Promise((resolve, reject) => {
          try {
            const res = this.remove(key);
            resolve(res);
          } catch (error) {
            reject(error as Error);
          }
        }),
      );
    });

    await Promise.all(removePromises);
  }

  async download(key: string): Promise<GetObjectCommandOutput | null> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      return response;
    } catch (error) {
      Logger.error(error, 'BucketService');
      return null;
    }
  }
}
