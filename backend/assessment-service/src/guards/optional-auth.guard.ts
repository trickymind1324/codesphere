import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

/**
 * Guard that allows both authenticated users and internal service-to-service calls
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check for internal service header (for service-to-service communication)
    const internalHeader = request.headers['x-internal-service'];
    if (internalHeader === 'true') {
      // Mark as internal request
      request.isInternalRequest = true;
      return true;
    }

    // Check for JWT token (for user authentication)
    const token = this.extractTokenFromHeader(request);

    if (token) {
      try {
        const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
        const payload = jwt.verify(token, secret);

        // Attach user info to request
        request.user = payload;
        return true;
      } catch (error) {
        // Invalid token, but we'll allow the request through
        // Controller can check if user exists
      }
    }

    // Allow unauthenticated access (controller handles what to return)
    request.user = null;
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
