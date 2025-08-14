import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ERR_TYPES } from 'lib/constants';
import { Observable, catchError } from 'rxjs';

@Injectable()
export class PrismaInterceptor implements NestInterceptor {
  constructor() {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          console.error(error);
          throw new InternalServerErrorException({
            type: ERR_TYPES.prisma_err,
            //@ts-expect-error I know what I have done.
            message: error.meta.cause,
          });
        }
        throw error;
      }),
    );
  }
}
