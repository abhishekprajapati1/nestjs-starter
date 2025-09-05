import {
  AdapterGetFileResponse,
  AdapterRemoveResponse,
  StorageAdapter,
  UploadedFile,
  UploadOptions,
} from './storage.types';
import { createReadStream, existsSync, promises as fs } from 'fs';
import { lookup } from 'mime-types';
import * as path from 'path';

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;
  private basePath: string;

  constructor(uploadDir = 'uploads') {
    this.uploadDir = uploadDir;
    this.basePath = path.join(process.cwd(), uploadDir);
  }

  async upload(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<UploadedFile> {
    const { key } = options;

    const filePath = path.join(this.uploadDir, key);

    // Ensure subdirectory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Write file to disk
    await fs.writeFile(filePath, file.buffer);

    return {
      url: `${process.env.API_URL}/storage/${key.replace(/[\\/]/g, "%2F")}`, // serve via NestJS static middleware
      fieldname: file.fieldname,
      key,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async remove(key: string): Promise<AdapterRemoveResponse> {
    const filePath = path.join(this.uploadDir, key);

    try {
      await fs.unlink(filePath);
      return { success: true, message: `${key} deleted successfully.` };
    } catch (err) {
      return {
        success: false,
        message: `Failed to delete ${key}: ${(err as Error).message}`,
      };
    }
  }

  //eslint-disable-next-line
  async getFile(key: string): Promise<AdapterGetFileResponse | null> {
    const fullPath = path.join(this.basePath, key);
    if (!existsSync(fullPath)) return null;
    const contentType = lookup(fullPath) || 'application/octet-stream';
    return {
      stream: createReadStream(fullPath),
      contentType,
    };
  }
}
