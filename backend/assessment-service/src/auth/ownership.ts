import { ForbiddenException } from '@nestjs/common';

export interface Requester {
  sub: string;
  role?: string;
}

/**
 * Assessments are scoped to the recruiter who created them (createdBy holds
 * the owner's Keycloak sub). Every recruiter-facing read or write of a
 * specific assessment — or of anything reached through one (invitations,
 * results, glass-box events) — must pass this check; platform admins are
 * exempt. Candidate-side access is token-based and never goes through here.
 */
export function assertAssessmentOwner(
  createdBy: string | null | undefined,
  user: Requester,
): void {
  if (user.role === 'platform_admin') return;
  if (!createdBy || createdBy !== user.sub) {
    throw new ForbiddenException('You do not have access to this assessment');
  }
}
