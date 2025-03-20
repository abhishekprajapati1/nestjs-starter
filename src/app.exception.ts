import {
  ExceptionFilter,
  Catch,
  HttpException,
  ArgumentsHost,
} from '@nestjs/common';
import { Response } from 'express';
import { ERR_TYPES } from '../lib/constants';

export type ExceptionResponseType = object & {
  type: string;
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException & { type: string }, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse() as
      | ExceptionResponseType
      | string;
    let type = ERR_TYPES.internal_server_err; // Define your type here

    // Check if exceptionResponse is an ob ject with type property
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      type = exceptionResponse.type || type;
    }

    const responseBody = {
      status: status,
      timestamp: new Date().toISOString(),
      message: exception.message,
      type: type,
    };
    response.status(status).json(responseBody);
  }
}
