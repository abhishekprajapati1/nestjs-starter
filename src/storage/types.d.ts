import { UploadedFile, Uploads } from "./storage.types";

declare global {
  namespace Express {
    interface Request {
      uploads?: Uploads;
      upload?: UploadedFile;
    }
  }
}
