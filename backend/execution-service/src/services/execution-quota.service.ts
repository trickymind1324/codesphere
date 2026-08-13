import { Injectable } from '@nestjs/common';

/**
 * Per-invitation-token controls for the anonymous assessment-execute path:
 *  - a rolling execution quota so a single (possibly leaked) token cannot spawn
 *    unlimited sandbox containers, and
 *  - a short-lived cache of the token's validity so the guard does not hit
 *    assessment-service on every keystroke-driven run.
 *
 * In-memory and therefore per-instance — correct for the current single-replica
 * deployment. When execution-service is scaled to multiple replicas, back these
 * with Redis so the quota is shared.
 */
@Injectable()
export class ExecutionQuotaService {
  private readonly maxPerWindow = 120; // executions per token per window
  private readonly windowMs = 10 * 60 * 1000; // 10 minutes
  private readonly validationTtlMs = 30 * 1000; // cache token validity 30s

  private readonly counters = new Map<string, { count: number; resetAt: number }>();
  private readonly validated = new Map<string, number>(); // token -> expiry

  /** Returns false when the token has exhausted its quota for the window. */
  consume(token: string, now: number): boolean {
    const entry = this.counters.get(token);
    if (!entry || now >= entry.resetAt) {
      this.counters.set(token, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (entry.count >= this.maxPerWindow) {
      return false;
    }
    entry.count += 1;
    return true;
  }

  isValidationCached(token: string, now: number): boolean {
    const expiry = this.validated.get(token);
    return expiry !== undefined && now < expiry;
  }

  cacheValidation(token: string, now: number): void {
    this.validated.set(token, now + this.validationTtlMs);
  }
}
