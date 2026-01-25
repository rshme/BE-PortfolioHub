import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const statusCode = response.statusCode;

        // If data already has the correct structure
        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'statusCode' in data &&
          'data' in data
        ) {
          return data as ApiResponse<T>;
        }

        // If data has only message property (success messages without data)
        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          !('data' in data)
        ) {
          return {
            statusCode,
            message: data.message as string,
            data: null as any,
          };
        }

        // Default transformation
        const plainData = instanceToPlain(data);
        return {
          statusCode,
          message: 'Success',
          data: plainData as T,
        };
      }),
    );
  }
}
