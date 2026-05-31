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

- **Modern Cloud IDE** — Monaco Editor with multi-file support and integrated terminal
- **Real-World Scenarios** — Debug memory leaks, race conditions, slow queries, and broken services
- **AI Socratic Tutor** — Guided hints that nudge without spoiling the solution
- **Code Playback** — Replay your coding sessions to review your approach
- **Progress Analytics** — Heatmaps, skill tracking, and personalized recommendations

### For Companies

- **Glass Box Analytics** — Insight into *how* candidates solve problems (keystrokes, debugging flow, code quality)
- **Anti-Cheating Tools** — Tab switch detection, paste analysis, and code style consistency checks
- **Customizable Assessments** — Mix algorithms, real-world debugging, and system design
- **Candidate-Friendly Experience** — Modern IDE with optional immediate feedback

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Monaco Editor, Tailwind CSS
- **Backend:** Node.js (API Gateway, Auth), Go (Problems, Assessments), Rust (Code Execution), Python (AI/ML)
- **Databases:** PostgreSQL, Redis, Elasticsearch, ClickHouse
- **Infrastructure:** Docker, Kubernetes, AWS
- **Realtime:** WebSockets for code execution streaming and collaborative editing

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

For full setup instructions including each backend service, see [SETUP.md](./SETUP.md).

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
├── backend/           # Microservices (API Gateway, Auth, Problems, Execution, AI)
├── database/          # Schema files and migrations
├── infrastructure/    # Docker, Kubernetes, and deployment configs
├── docs/              # Product, technical, and API documentation
└── scripts/           # Utility and tooling scripts
```

---

## Documentation

Comprehensive documentation lives in the [`docs/`](./docs/) directory:

- **[Product Strategy](./docs/Product_Strategy.md)** — Vision, differentiators, roadmap
- **Technical Specifications (FRDs)** — Frontend, backend, database, infrastructure, security, AI/ML
- **Product Requirements (PRDs)** — Authentication, IDE, assessments, monetization

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
