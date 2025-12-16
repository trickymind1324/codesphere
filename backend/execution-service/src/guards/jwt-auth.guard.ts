import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private publicKey: string;

  constructor(private configService: ConfigService) {
    // Load public key from auth service (for development)
    // In production, this should be from environment variable or shared secret manager
    try {
      this.publicKey = readFileSync(
        join(__dirname, '../../../auth-service/keys/public.pem'),
        'utf8'
      );
    } catch (error) {
      // Fallback to environment variable
      this.publicKey = this.configService.get<string>('JWT_PUBLIC_KEY') || '';
      if (!this.publicKey) {
        console.error('JWT public key not found! Authentication will fail.');
      }
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'codesphere.com',
        audience: 'codesphere-api',
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
