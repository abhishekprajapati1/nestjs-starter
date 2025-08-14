import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError } from 'rxjs';
import { BucketService } from './bucket.service';
import { BucketUploadsType } from './decorators/bucket-uploads.decorator';

@Injectable()
export class FileRemovalInterceptor implements NestInterceptor {
  constructor(private readonly bucketService: BucketService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: any = context.switchToHttp().getRequest();

    return next.handle().pipe(
      catchError(async (error) => {
        if (request.file) {
          await this.bucketService.remove(request.bucket_uploads.key);
        } else if (Array.isArray(request.files)) {
          await this.bucketService.removeMany(
            request.bucket_uploads?.map((bu: BucketUploadsType) => bu.key),
          );
        } else if (request.files) {
          for (const fieldname in request.files) {
            if (request.bucket_uploads?.[fieldname]) {
              await this.bucketService.removeMany(
                request.bucket_uploads[fieldname]?.map(
                  (bu: BucketUploadsType) => bu.key,
                ),
              );
            }
          }
        }
        throw error;
      }),
    );
  }
}
