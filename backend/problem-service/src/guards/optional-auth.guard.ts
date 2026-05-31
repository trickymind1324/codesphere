import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Guard that allows both authenticated users and internal service-to-service calls
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private publicKey: string;

  constructor(private configService: ConfigService) {
    // Load the public key for RS256 verification
    try {
      this.publicKey = readFileSync(
        join(__dirname, '../../keys/public.pem'),
        'utf8'
      );
    } catch (error) {
      console.error('Failed to load JWT public key:', error.message);
      throw new Error('JWT public key not found');
    }
  }

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
        const payload = jwt.verify(token, this.publicKey, {
          algorithms: ['RS256'],
          issuer: 'codesphere.com',
          audience: 'codesphere-api',
        });

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
