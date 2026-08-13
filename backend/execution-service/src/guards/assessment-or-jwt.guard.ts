import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { getTokenVerifier, TokenVerifier } from '../auth/token-verifier';
import { ExecutionQuotaService } from '../services/execution-quota.service';

/**
 * Allows two kinds of callers:
 *  - logged-in users with a Bearer JWT (practice mode), or
 *  - anonymous assessment candidates presenting a started invitation token
 *    in the X-Assessment-Token header. Possession of a started token proves
 *    the caller is inside a live assessment session; it is resolved against
 *    assessment-service server-side (same trust model as glass-box ingest).
 *
 * Sets request.user for JWT callers, request.assessmentToken for candidates.
 * Candidate tokens are rate-limited per session and their validity is cached
 * so a rapid run/test loop doesn't hammer assessment-service.
 */
@Injectable()
export class AssessmentOrJwtGuard implements CanActivate {
  private readonly verifier: TokenVerifier;
  private readonly assessmentServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private readonly quota: ExecutionQuotaService,
  ) {
    this.verifier = getTokenVerifier(this.configService);
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
        request.user = await this.verifier.verify(bearer);
        return true;
      } catch {
        // fall through to the assessment-token path
      }
    }

    // Path 2: live assessment session token
    const assessmentToken = request.headers['x-assessment-token'];
    if (typeof assessmentToken === 'string' && assessmentToken.length > 0) {
      const now = Date.now();

      // Validate the token (using a short-lived cache to avoid calling
      // assessment-service on every run).
      let valid = this.quota.isValidationCached(assessmentToken, now);
      if (!valid) {
        try {
          const { data } = await axios.get(
            `${this.assessmentServiceUrl}/api/v1/invitations/${encodeURIComponent(
              assessmentToken,
            )}`,
            { timeout: 5000 },
          );
          if (data?.valid && data?.invitation?.status === 'started') {
            valid = true;
            this.quota.cacheValidation(assessmentToken, now);
          }
        } catch {
          // invalid/expired token — handled below
        }
      }
      if (!valid) {
        throw new UnauthorizedException('Assessment session is not active');
      }

      // Enforce the per-token execution quota.
      if (!this.quota.consume(assessmentToken, now)) {
        throw new HttpException(
          'Execution limit reached for this assessment session',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      request.user = null;
      request.assessmentToken = assessmentToken;
      return true;
    }

    throw new UnauthorizedException('No token provided');
  }
}
