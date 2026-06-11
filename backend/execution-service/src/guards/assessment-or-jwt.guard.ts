import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Allows two kinds of callers:
 *  - logged-in users with a Bearer JWT (practice mode), or
 *  - anonymous assessment candidates presenting a started invitation token
 *    in the X-Assessment-Token header. Possession of a started token proves
 *    the caller is inside a live assessment session; it is resolved against
 *    assessment-service server-side (same trust model as glass-box ingest).
 *
 * Sets request.user for JWT callers, request.assessmentToken for candidates.
 */
@Injectable()
export class AssessmentOrJwtGuard implements CanActivate {
  private publicKey: string;
  private readonly assessmentServiceUrl: string;

  constructor(private configService: ConfigService) {
    try {
      this.publicKey = readFileSync(
        join(__dirname, '../../../auth-service/keys/public.pem'),
        'utf8',
      );
    } catch (error) {
      this.publicKey = this.configService.get<string>('JWT_PUBLIC_KEY') || '';
    }
    this.assessmentServiceUrl = this.configService.get<string>(
      'ASSESSMENT_SERVICE_URL',
      'http://localhost:8003',
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Path 1: standard JWT
    const [type, bearer] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer' && bearer) {
      try {
        request.user = jwt.verify(bearer, this.publicKey, {
          algorithms: ['RS256'],
          issuer: 'codesphere.com',
          audience: 'codesphere-api',
        });
        return true;
      } catch {
        // fall through to the assessment-token path
      }
    }

    // Path 2: live assessment session token
    const assessmentToken = request.headers['x-assessment-token'];
    if (typeof assessmentToken === 'string' && assessmentToken.length > 0) {
      try {
        const { data } = await axios.get(
          `${this.assessmentServiceUrl}/api/v1/invitations/${encodeURIComponent(
            assessmentToken,
          )}`,
          { timeout: 5000 },
        );
        if (data?.valid && data?.invitation?.status === 'started') {
          request.user = null;
          request.assessmentToken = assessmentToken;
          return true;
        }
      } catch {
        // invalid/expired token — handled below
      }
      throw new UnauthorizedException('Assessment session is not active');
    }

    throw new UnauthorizedException('No token provided');
  }
}
