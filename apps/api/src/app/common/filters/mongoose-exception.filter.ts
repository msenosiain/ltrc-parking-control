import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class MongooseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const ex = exception as { name?: string; message?: string; status?: number; response?: { statusCode?: number } };

    if (
      ex?.name === 'MongoServerError' ||
      ex?.name === 'ValidationError'
    ) {
      return response.status(HttpStatus.BAD_REQUEST).json({
        message: ex?.message || 'Bad Request',
        error: ex?.name || 'MongoError',
        statusCode: HttpStatus.BAD_REQUEST,
      });
    }

    const status = ex?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = ex?.message || 'Internal server error';
    const errorName = ex?.name || 'Error';
    const statusCode = ex?.response?.statusCode || status;

    return response.status(status).json({
      message,
      error: errorName,
      statusCode,
    });
  }
}
