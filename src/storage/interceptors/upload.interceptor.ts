import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { StorageService } from "../storage.service";
import { Request } from "express";

@Injectable()
export class UploadInterceptor implements NestInterceptor {
  constructor(private readonly storageService: StorageService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: Request = context.switchToHttp().getRequest();

    if (request.file) {
      const meta = await this.storageService.upload(request.file, {
        visibility: "protected",
      });
      request.upload = meta;
    } else if (Array.isArray(request.files)) {
      const meta = await this.storageService.uploadMany(request.files, {
        visibility: "protected",
      });
      request.uploads = meta;
    } else if (request.files) {
      const filesMeta = {};
      for (const fieldname in request.files) {
        if (request.files[fieldname]) {
          const meta = await this.storageService.uploadMany(
            request.files[fieldname],
            {
              visibility: "protected",
            },
          );
          filesMeta[fieldname] = meta;
        }
      }
      request.uploads = filesMeta;
    }

    return next.handle();
  }
}
