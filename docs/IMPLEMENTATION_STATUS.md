# CodeSphere — Implementation Status (Authoritative)

**Last Updated:** June 10, 2026
**Supersedes:** the January 2026 status/plan documents (removed from the repo 2026-08-11)

---

## Summary

Phase 1 (MVP) is **complete**. Phase 2 (AI layer / differentiators) is
**implemented end-to-end**: the Socratic tutor, Code Playback, and Glass Box
analytics now have both backend services and wired-up UI. The platform is
packaged for deployment — every service has a production Dockerfile and
`docker-compose.prod.yml` brings the entire stack up, including a mail relay
that unblocks the old SMTP launch blocker.

Phase 3 (ecosystem) is not started.

**Platform architecture:** requests enter through **Kong** (the API gateway —
TLS termination, routing, rate limiting) and identity is handled by
**Keycloak** (OIDC). Behind the gateway sit five services — `auth-service`
(a stateless Keycloak proxy), `problem-service`, `execution-service`,
`assessment-service` (NestJS/TypeScript), and `ai-service` (Python/FastAPI) —
backed by PostgreSQL and Redis.

---

## Phase 1 — MVP ✅ Complete

**Candidate side**
- Problem library (60 problems: 50 algorithmic + 10 multi-file debugging tasks)
- Monaco IDE, 7 languages (Python, JS, TS, Java, C++, C, Go), Docker-sandboxed
  execution with WebSocket streaming
- Multi-file debugging interface with file tree
- Submissions history, user statistics dashboard
- Candidate profiles: bio, designation, skills, resume upload, and earned badges
- Auth: Keycloak (OIDC) handles identity — login, registration, token issuance,
  password reset, and MFA all run in Keycloak. The `auth-service` is a thin,
  stateless registration/login proxy in front of it (no database of its own)

**Enterprise side**
- Assessment CRUD with drag-and-drop problem selection and points
- Bulk email invitations with unique tokens and expiry
- Timed candidate assessment flow (timer, auto-save, auto-submit)
- Results dashboard with statistics and CSV export

## Phase 2 — AI Layer & Differentiators ✅ Implemented

| Feature | Backend | Frontend | Notes |
|---|---|---|---|
| **AI Socratic Tutor** | ai-service `/api/v1/ai/socratic` (FastAPI, provider-swappable, Ollama default) | "AI Tutor" tab on the problem page; context-aware (sends current code) | Never writes code; one guiding question per turn |
| **Code Playback** | problem-service `/api/v1/playback/*` (event ingest + session fetch) | Recorder wired into the problem IDE; viewer at `/playback/:sessionId` with 1–20x speed | Initial snapshot + Monaco deltas; "Replay" button in the editor |
| **Glass Box analytics** | assessment-service `/api/v1/glass-box/*` (token-bound ingest, recruiter summary) | Tracker wired into AssessmentIDE (paste/copy/tab-blur/run/submit); per-candidate report on the recruiter Results page | Includes AI-written narrative via ai-service `/api/v1/ai/glass-box-summary` |
| **Anti-cheating signals** | Same event pipeline | Tab switches, window blur, paste sizes surfaced in the Glass Box report | Browser fingerprinting not implemented (Phase 3) |

## Deployment Readiness ✅

- Production builds pass for all 4 Node services (`tsc`), the frontend
  (`tsc && vite build`, code-split bundles), and the Python ai-service
- Production Dockerfiles for every service (multi-stage, non-root where possible)
  and frontend (nginx with API reverse proxy)
- `docker-compose.prod.yml`: full stack — Kong (API gateway, TLS), Keycloak
  (identity), 3× Postgres (problems, assessments, Keycloak), Redis, MailHog,
  5 backend services (auth, problem, execution, assessment, ai), and the frontend
- **Email blocker resolved**: MailHog relay works out of the box (UI on :8025);
  real SMTP is a 3-env-var override
- `scripts/build-runtime-images.sh` builds the 5 sandbox runtime images
- `scripts/smoke-test.sh` validates register → login → problems → execute →
  assessments against a running stack

The deployment runbook is maintained privately by the team.

## Phase 3 — Ecosystem ❌ Not Started

These remain genuinely out of scope of the current codebase and are tracked
for the next cycle:

- System Design Whiteboard (collaborative canvas + traffic simulation)
- Live Interview mode (pair programming with video/audio)
- Marketplace for user-created courses/challenges
- VS Code plugin for taking tests locally
- Browser fingerprinting / LLM-extension detection (Honor Guard 2.0)
- AI problem recommendations on the dashboard; AI hire/reject recommendation

## Known Limitations

- The Socratic tutor and Glass Box AI summary require a running LLM provider
  (Ollama by default); both degrade gracefully with a clear UI message
- Playback records per problem-page visit (a new session id per page load);
  cross-session history browsing is future work
- Migrations run from the repo, not from containers (needs dev dependencies)
