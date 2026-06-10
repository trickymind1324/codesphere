# CodeSphere — Production Deployment Guide

**Last Updated:** June 10, 2026

This guide covers deploying the full CodeSphere stack with Docker Compose. Every
service ships a production Dockerfile; `docker-compose.prod.yml` wires them
together with databases, Redis, and a mail relay.

---

## Architecture at a Glance

| Service | Port | Image source | Depends on |
|---|---|---|---|
| frontend (nginx) | 3000 | `frontend/Dockerfile` | all backend services |
| auth-service | 3001 | `backend/auth-service/Dockerfile` | postgres-auth, redis |
| problem-service | 8001 | `backend/problem-service/Dockerfile` | postgres-problems, redis |
| execution-service | 8002 | `backend/execution-service/Dockerfile` | redis, host Docker daemon |
| assessment-service | 8003 | `backend/assessment-service/Dockerfile` | postgres-assessments, redis, SMTP |
| ai-service | 8004 | `backend/ai-service/Dockerfile` | LLM provider (Ollama by default) |
| mailhog (dev SMTP) | 8025 (UI) | public image | — |

The frontend nginx container terminates HTTP and reverse-proxies `/api/v1/*`
to the right service (same routing table as the vite dev proxy), so browsers
only ever talk to port 3000.

---

## 1. One-time Setup

### JWT signing keys (RS256)

Auth-service signs tokens with a private RSA key; every other service verifies
with the public key. Generate once:

```bash
cd backend/auth-service
./generate-keys.sh        # creates keys/private.pem and keys/public.pem
```

The compose file mounts these into each container — auth gets both keys,
everything else gets `public.pem` read-only.

### Sandbox runtime images

The execution-service launches a short-lived, network-isolated container per
code run. Build the runtime images on the host that runs the stack:

```bash
./scripts/build-runtime-images.sh
```

### Email (SMTP)

By default the stack uses the bundled **MailHog** relay — invitations "send"
immediately and are viewable at `http://localhost:8025`. No credentials needed.

For real delivery, export these before `docker compose up`:

```bash
export SMTP_HOST=smtp.sendgrid.net
export SMTP_PORT=587
export SMTP_USER=apikey
export SMTP_PASSWORD=<sendgrid-api-key>
export SMTP_FROM="CodeSphere <noreply@yourdomain.com>"
```

(Gmail app passwords and AWS SES work the same way; only the host/credentials
change.)

### AI provider

The ai-service speaks to **Ollama** by default at
`http://host.docker.internal:11434` (i.e., Ollama running on the host):

```bash
ollama pull llama3.2:3b && ollama serve
```

Override with `OLLAMA_HOST` / `OLLAMA_MODEL`, or set `LLM_PROVIDER` once
another provider class is added. The Socratic tutor and Glass Box AI summary
degrade gracefully (clear error message in the UI) when the provider is down.

---

## 2. Bring the Stack Up

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

First build takes a few minutes (multi-stage Node builds). Subsequent builds
are cached.

## 3. Migrations and Seed Data

Migrations run from the repo (they need dev dependencies), pointed at the
dockerized databases:

```bash
# Auth (port 5434)
cd backend/auth-service && npm run migration:run

# Problems (port 5433) — then seed the 60-problem library + debugging tasks
cd ../problem-service && npm run migration:run && npm run seed

# Assessments (port 5435)
cd ../assessment-service && npm run migration:run
```

The local `.env` files already point at these ports, so no changes are needed
when running migrations from the host.

Create the first recruiter account:

```bash
cd backend/auth-service && npm run create:recruiter
```

## 4. Verify

```bash
bash scripts/smoke-test.sh
```

This walks register → login → list problems → execute code → list assessments
against the running stack. Then open `http://localhost:3000`.

---

## Production Hardening Checklist

- [ ] Set a real `POSTGRES_PASSWORD` (used by all three databases)
- [ ] Set `FRONTEND_URL` to the public URL (drives CORS + invitation links)
- [ ] Real SMTP credentials (see above) — MailHog is for staging only
- [ ] Put TLS in front of the frontend container (ALB / Cloudflare / certbot-nginx)
- [ ] Don't expose service ports (3001/8001–8004, 5433–5435, 6379) publicly —
      only the frontend's :3000 (or :443) should be reachable; the published
      ports in compose exist for smoke-testing and can be removed
- [ ] Rotate JWT keys periodically (`generate-keys.sh`, restart stack)
- [ ] Database backups (`pg_dump` cron or managed Postgres)
- [ ] Monitor `docker stats` for the execution-service — sandbox bursts are
      CPU-bound; scale `MAX_CONCURRENT_EXECUTIONS` with host size

## Scaling Notes

- All services are stateless (state lives in Postgres/Redis) — they scale
  horizontally behind a load balancer; sticky sessions are only needed for
  the execution WebSocket (`/socket.io`).
- For Kubernetes, the same images work as-is; the execution-service needs a
  node-level Docker socket (or migrate the executor to a Firecracker/gVisor
  runtime per the FRD's longer-term plan).
