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

- Node.js 20+
- Docker and Docker Compose
- Git

### Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/codesphere.git
cd codesphere

# Start database services (PostgreSQL, Redis)
docker-compose up -d

# Install dependencies
npm install

# Start the development servers (frontend + backend)
npm run dev
```

### Local Login (seed accounts)

Identity is handled by Keycloak. A recruiter account is seeded automatically
when Keycloak imports the realm on first start
(`infrastructure/keycloak/realm-codesphere.json`):

| Role | Email | Password |
|---|---|---|
| Recruiter | `recruiter@codesphere.com` | `Recruiter123!` |

Candidate accounts can be registered normally through the UI; candidates
taking an assessment access it via the invitation link (no account needed).

### Production Deployment

The entire stack (frontend, 5 backend services, databases, Redis, mail relay)
runs with one command:

```bash
./scripts/build-runtime-images.sh                            # once
docker compose -f docker-compose.prod.yml up -d --build
bash scripts/smoke-test.sh                                   # verify
```

Detailed setup and deployment guides are maintained privately by the team.

### Common Scripts

```bash
npm run dev            # Start frontend and backend in dev mode
npm run build          # Build all workspaces
npm test               # Run tests across workspaces
npm run lint           # Lint all workspaces
npm run format         # Format code with Prettier
```

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
