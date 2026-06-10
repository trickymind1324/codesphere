import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';

/**
 * Resolve the RS256 public key from env. Containers mount the key file and
 * set JWT_PUBLIC_KEY_FILE; local dev keeps the PEM inline in JWT_PUBLIC_KEY.
 */
export function resolveJwtPublicKey(configService: ConfigService): string | undefined {
  const inline = configService.get<string>('JWT_PUBLIC_KEY');
  if (inline) return inline;
  const file = configService.get<string>('JWT_PUBLIC_KEY_FILE');
  if (file) {
    try {
      return readFileSync(file, 'utf-8');
    } catch {
      return undefined;
    }
  }
  return undefined;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Use public key for RSA token verification
      const publicKey = resolveJwtPublicKey(this.configService);
      if (!publicKey) {
        throw new Error('JWT_PUBLIC_KEY not configured');
      }

      const payload = jwt.verify(token, publicKey, {
        algorithms: ['RS256'], // RSA algorithm
      });

      // Attach user info to request
      request.user = payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
