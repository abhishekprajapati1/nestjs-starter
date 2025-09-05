import { Readable } from "stream";

export type FileVisibility = "public" | "protected";
export interface UploadedFile {
  url: string;
  key: string;
  fieldname: string;
  size: number;
  mimetype: string;
}
export type Uploads =
  | UploadedFile[]
  | {
      [fieldname: string]: UploadedFile[];
    };
export interface UploadOptions {
  visibility?: FileVisibility;
  contentDisposition?: string;
  key: string;
}
export interface AdapterRemoveResponse {
  success: boolean;
  message: string;
}
export interface AdapterGetFileResponse {
  stream: Readable;
  contentType: string;
}
export interface StorageAdapter {
  upload(
    file: Express.Multer.File,
    options: UploadOptions,
  ): Promise<UploadedFile>;
  remove(key: string): Promise<AdapterRemoveResponse>;
  getFile(key: string): Promise<AdapterGetFileResponse | null>;
}
export interface BuildKeyOptions {
  visibility: FileVisibility;
}
