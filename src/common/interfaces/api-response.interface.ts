export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
  path?: string;
}
