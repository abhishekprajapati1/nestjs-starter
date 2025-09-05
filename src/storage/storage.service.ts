import { Injectable } from '@nestjs/common';
import {
  AdapterGetFileResponse,
  AdapterRemoveResponse,
  BuildKeyOptions,
  StorageAdapter,
  UploadedFile,
  UploadOptions,
} from './storage.types';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { HealthStatus } from 'src/app.service';

@Injectable()
export class StorageService {
  constructor(private readonly adapter: StorageAdapter) {}

  upload(
    file: Express.Multer.File,
    options: Omit<UploadOptions, 'key'>,
  ): Promise<UploadedFile> {
    const { visibility = 'public' } = options;
    return this.adapter.upload(file, {
      ...options,
      key: this.buildKey(file.originalname, { visibility }),
    });
  }

  uploadMany(
    files: Express.Multer.File[],
    options: Omit<UploadOptions, 'key'>,
  ): Promise<UploadedFile[]> {
    const { visibility = 'public' } = options;
    return Promise.all(
      files.map((file) => this.upload(file, { ...options, visibility })),
    );
  }

  remove(key: string): Promise<AdapterRemoveResponse> {
    return this.adapter.remove(key);
  }

  removeMany(keys: string[]): Promise<AdapterRemoveResponse[]> {
    return Promise.all(keys.map((key) => this.remove(key)));
  }

  buildKey(fileName: string, options: BuildKeyOptions) {
    const { visibility = 'public' } = options;
    const env =
      process.env.DEV_ENVIRONMENT === 'true' ? 'development' : 'production';
    const ext = path.extname(fileName);
    return path.join(env, visibility, `${uuid()}${ext}`);
  }

  async getFile(key: string): Promise<AdapterGetFileResponse | null> {
    return this.adapter.getFile(key);
  }

  health(): HealthStatus {
    return {
      status: 'healthy',
      message: 'Storage is setup',
      details: {
        provider: 'local',
      },
    };
  }
}
