import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggingService } from '../../modules/logging/logging.service';

/**
 * Interceptor untuk logging request/response metrics
 * Mengukur performance dan tracking API usage
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();
    
    const { method, url, headers, body } = request;
    const userId = request.user?.id || request.user?.userId;
    const userAgent = headers['user-agent'];

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          const requestSize = JSON.stringify(body || {}).length;
          const responseSize = JSON.stringify(data || {}).length;

          // Log API request metrics
          this.loggingService.logApiRequest({
            method,
            url,
            userId,
            statusCode: response.statusCode,
            responseTimeMs: responseTime,
            requestSize,
            responseSize,
            userAgent,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;

          // Log failed requests
          this.loggingService.logApiRequest({
            method,
            url,
            userId,
            statusCode: error.status || 500,
            responseTimeMs: responseTime,
            userAgent,
            errorMessage: error.message,
          });

          // Log error detail
          this.loggingService.error(
            `API Error: ${method} ${url}`,
            error.stack,
            'MetricsInterceptor',
            {
              userId,
              statusCode: error.status || 500,
              errorMessage: error.message,
            },
          );
        },
      }),
    );
  }
}
