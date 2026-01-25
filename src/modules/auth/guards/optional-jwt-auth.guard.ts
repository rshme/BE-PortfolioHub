import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Auth Guard
 * 
 * This guard attempts to authenticate the user via JWT token,
 * but allows the request to proceed even if authentication fails.
 * This is useful for endpoints that should work for both
 * authenticated and unauthenticated users.
 * 
 * When authentication succeeds, the user object will be available
 * via @CurrentUser() decorator. When it fails, user will be undefined.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // If there's an error or no user, just return null/undefined
    // instead of throwing an error
    return user;
  }
}
