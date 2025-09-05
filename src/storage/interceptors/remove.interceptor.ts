import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, catchError } from "rxjs";
import { StorageService } from "../storage.service";
import { Request } from "express";

@Injectable()
export class RemoveInterceptor implements NestInterceptor {
  constructor(private readonly storageService: StorageService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      catchError(async (error) => {
        if (request.file && request.upload) {
          await this.storageService.remove(request.upload.key);
        } else if (
          Array.isArray(request.files) &&
          Array.isArray(request.uploads)
        ) {
          await this.storageService.removeMany(
            request.uploads?.map((bu) => bu.key),
          );
        } else if (
          request.files &&
          request.uploads &&
          !Array.isArray(request.files) &&
          !Array.isArray(request.uploads)
        ) {
          for (const fieldname in request.files) {
            if (request.uploads?.[fieldname]) {
              await this.storageService.removeMany(
                request.uploads[fieldname]?.map((bu) => bu.key),
              );
            }
          }
        }
        throw error;
      }),
    );
  }
}
