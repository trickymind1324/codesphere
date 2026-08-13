import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Allows only trusted service-to-service calls: the caller must present the
 * shared internal key. Used for the result-reporting endpoint so a candidate
 * cannot record their own passes — only execution-service (which ran the
 * tests and holds the key) can.
 */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  private readonly key: string;

  constructor(config: ConfigService) {
    this.key = config.get<string>('INTERNAL_API_KEY', '');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-internal-key'];
    if (!this.key || provided !== this.key) {
      throw new UnauthorizedException('Invalid internal key');
    }
    return true;
  }
}
