import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { BucketService } from './bucket.service';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  constructor(private readonly bucketService: BucketService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request: any = context.switchToHttp().getRequest();

    if (request.file) {
      const meta = await this.bucketService.upload(request.file);
      request.bucket_uploads = meta;
    } else if (Array.isArray(request.files)) {
      const meta = await this.bucketService.uploadMany(request.files);
      request.bucket_uploads = meta;
    } else if (request.files) {
      const filesMeta = {};
      for (const fieldname in request.files) {
        if (request.files[fieldname]) {
          const meta = await this.bucketService.uploadMany(
            request.files[fieldname],
          );
          filesMeta[fieldname] = meta;
        }
      }
      request.bucket_uploads = filesMeta;
    }

    return next.handle();
  }
}
