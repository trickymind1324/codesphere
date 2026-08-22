# CodeSphere

> **Where Code Meets Reality**

A unified technical skill platform that bridges algorithmic challenges with real-world engineering practice.

---

## Overview

CodeSphere is an open coding platform that combines a modern cloud IDE, real-world debugging scenarios, and AI-assisted learning. It serves two audiences:

- **Developers** practicing technical skills beyond abstract algorithm puzzles
- **Companies** evaluating candidates on how they think, not just whether tests pass

---

## Features

### For Developers

- **Modern Cloud IDE** — Monaco Editor with multi-file support, sandboxed execution, and real-time output streaming
- **Real-World Scenarios** — Multi-file debugging tasks alongside classic algorithmic problems
- **AI Socratic Tutor** — Guided hints that nudge without spoiling the solution
- **Code Playback** — Replay your coding sessions to review your approach
- **Progress Dashboard** — Problems solved, acceptance rate, languages used, and submission history

### For Companies

- **Glass Box Analytics** — Insight into *how* candidates solve problems, with an AI-written summary of their approach
- **Integrity Signals** — Tab-switch and window-blur tracking and paste detection, surfaced per session
- **Customizable Assessments** — Mix algorithmic challenges and real-world debugging tasks, with timed sessions and unique invite links
- **Candidate-Friendly Experience** — The same modern IDE candidates practice in, with clear results reporting

---

## Roadmap

CodeSphere's north star is to evaluate *how* people build, not just whether tests pass. Building toward that, planned work includes:

- **Richer analytics** — activity heatmaps and skill-graph tracking for candidates
- **AI-driven recommendations** — surface the next problem based on a developer's weak spots
- **System Design board** — a collaborative canvas with traffic simulation for design interviews
- **Live pair-programming mode** — real-time interviews with shared editing and audio/video

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Monaco Editor, Tailwind CSS
- **Backend:** NestJS (TypeScript) microservices — Auth, Problems, Code Execution, Assessments — plus a Python (FastAPI) AI service
- **Identity & Gateway:** Keycloak (OIDC) for authentication; Kong as the API gateway (TLS termination, routing, rate limiting)
- **Sandboxed execution:** Dockerized runtimes for the languages users write in — Python, JavaScript, TypeScript, Java, C, C++, and Go
- **Databases:** PostgreSQL and Redis
- **Infrastructure:** Docker and Docker Compose
- **Realtime:** WebSockets for streaming code-execution output

---

## Getting Started

### Prerequisites

- **Docker** (Docker Desktop, or Docker Engine with Compose v2) — this is all
  you need to run the platform
- **[Ollama](https://ollama.com)** — optional, for the AI features with a free
  local model (or bring your own API key — see below)
- **Node.js 20+** — only needed if you want to hack on the code

### Quick Start — run the whole platform

```bash
# 1. Clone
git clone https://github.com/trickymind1324/codesphere.git
cd codesphere

# 2. One-time setup: self-signed TLS cert + code-execution sandbox images
bash scripts/generate-local-tls.sh
bash scripts/build-runtime-images.sh

# 3. Bring up the full stack (frontend, 5 services, Kong, Keycloak, Postgres, Redis, MailHog)
docker compose -f docker-compose.prod.yml up -d --build
```

Open **https://localhost** (the cert is self-signed, so accept the browser
warning: *Advanced → Proceed*). To verify the stack end-to-end, run
`bash scripts/smoke-test.sh` — it checks the frontend, Keycloak, login, the
problems API, sandboxed code execution, and the assessments API. That's it — on first boot the databases are
created with the full schema **and the 60-problem library** (50 algorithmic +
10 multi-file debugging tasks) automatically, and Keycloak imports the realm
with a demo recruiter.

> If a page returns a 502 right after a rebuild, Kong may be holding a stale
> container address: `docker compose -f docker-compose.prod.yml restart kong`.

### Local Login (seed accounts)

Identity is handled by Keycloak. A recruiter account is seeded automatically
when Keycloak imports the realm on first start
(`infrastructure/keycloak/realm-codesphere.json`):

| Role | Email | Password |
|---|---|---|
| Recruiter | `recruiter@codesphere.com` | `Recruiter123!` |

Candidate accounts can be registered normally through the UI; candidates
taking an assessment access it via the invitation link (no account needed).
Invitation emails land in the local MailHog inbox (no real SMTP needed).

### AI features (Socratic Tutor & Glass Box summaries)

The AI features are optional — everything else works without them, and the UI
degrades with a clear message when no LLM is reachable. Pick one of:

**Option A — free local model via Ollama (default)**

```bash
# Install Ollama from https://ollama.com (or: brew install ollama)
ollama pull gemma3:4b        # ~3GB — the default model
# keep Ollama running (the desktop app, or `ollama serve`)
```

The containers reach your host's Ollama automatically
(`host.docker.internal:11434`). To use a lighter model:
`OLLAMA_MODEL=llama3.2:3b docker compose -f docker-compose.prod.yml up -d ai-service`.

**Option B — bring your own API key (Anthropic, OpenAI, or Gemini)**

Create a `.env` file next to `docker-compose.prod.yml` with one of:

```bash
# Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Google Gemini (via its OpenAI-compatible endpoint)
LLM_PROVIDER=openai
OPENAI_API_KEY=<your Gemini API key>
OPENAI_MODEL=gemini-2.0-flash
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

Then apply it: `docker compose -f docker-compose.prod.yml up -d ai-service`.
Any OpenAI-compatible endpoint (Groq, Together, Mistral, …) works the same
way via `OPENAI_BASE_URL`. See
[backend/ai-service/README.md](./backend/ai-service/README.md) for details.

### Developing

```bash
npm install            # Install all workspace dependencies
npm run build          # Build all workspaces
npm run lint           # Lint all workspaces
npm run format         # Format code with Prettier
```

For iterating on a single service, see the service READMEs (e.g.
[backend/ai-service](./backend/ai-service/README.md),
[backend/execution-service](./backend/execution-service/README.md)). The
Docker Compose stack above is the supported way to run the full platform —
auth flows require Kong and Keycloak, so a bare `npm run dev` frontend won't
be able to sign in on its own.

Deployment to a real domain is the same compose stack with real TLS certs at
the same paths; detailed production guides are maintained privately by the
team.

---

## Project Structure

```text
.
├── frontend/          # React + TypeScript client (Monaco-based IDE)
├── backend/           # Microservices — Auth, Problems, Execution, Assessments (NestJS), AI (Python)
├── database/          # Schema files and migrations
├── infrastructure/    # Kong gateway, Keycloak realm, and deployment configs
├── docs/              # Product, technical, and API documentation
└── scripts/           # Utility and tooling scripts
```

---

## Documentation

Comprehensive documentation lives in the [`docs/`](./docs/) directory:

- **[Implementation Status](./docs/IMPLEMENTATION_STATUS.md)** — What's built, current phase, known limitations
- **[Product Strategy](./docs/PRODUCT_STRATEGY.md)** — Vision, differentiators, roadmap
- **Technical Specifications (FRDs)** — Frontend, backend, database, and AI/ML architecture, plus the Universal Code Execution Engine spec
- **Product Requirements (PRDs)** — Candidate learning zone, enterprise hiring hub, the IDE, and assessments

See [docs/README.md](./docs/README.md) for the full index.

---

## Contributing

Contributions are welcome! Whether you want to fix bugs, add features, improve documentation, or propose new ideas:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes with clear messages
4. Push to your fork and open a Pull Request

Please make sure your changes pass linting and tests before submitting.

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgements

Built to make technical skill assessment more meaningful — for the people learning, and the teams hiring.
