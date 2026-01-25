import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string | string[];
    let error: string;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      message = responseObj.message || exception.message;
      error = responseObj.error || this.getErrorName(status);
    } else {
      message = exceptionResponse;
      error = this.getErrorName(status);
    }

    // Sanitize error message to avoid leaking system information
    const sanitizedMessage = this.sanitizeErrorMessage(message, status);

    const errorResponse: ApiErrorResponse = {
      statusCode: status,
      message: sanitizedMessage,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private sanitizeErrorMessage(
    message: string | string[],
    status: number,
  ): string | string[] {
    // If it's a validation error array, keep it as is (class-validator messages are safe)
    if (Array.isArray(message)) {
      return message;
    }

    // For known user-friendly errors, pass through
    const safeErrorPatterns = [
      'not found',
      'already exists',
      'invalid',
      'required',
      'unauthorized',
      'forbidden',
      'expired',
      'must be',
      'should be',
      'cannot be',
      'does not exist',
      'is required',
      'incorrect',
      'failed',
      'denied',
      'successful',
    ];

    const messageLower = message.toLowerCase();
    const isSafeMessage = safeErrorPatterns.some((pattern) =>
      messageLower.includes(pattern),
    );

    if (isSafeMessage) {
      return message;
    }

    // For potentially sensitive errors, return generic message based on status
    return this.getGenericErrorMessage(status);
  }

  private getGenericErrorMessage(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'The request could not be processed';
      case HttpStatus.UNAUTHORIZED:
        return 'Authentication is required';
      case HttpStatus.FORBIDDEN:
        return 'You do not have permission to access this resource';
      case HttpStatus.NOT_FOUND:
        return 'The requested resource was not found';
      case HttpStatus.CONFLICT:
        return 'The request conflicts with existing data';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'The request data could not be processed';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'An unexpected error occurred';
      default:
        return 'An error occurred while processing your request';
    }
  }

  private getErrorName(status: number): string {
    return HttpStatus[status] || 'Error';
  }
}
