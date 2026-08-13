# Contributing to CodeSphere

Thanks for your interest in contributing! This guide covers how to propose
changes and what we expect in a pull request.

## Ground rules

- Be respectful and constructive — see the [Code of Conduct](CODE_OF_CONDUCT.md).
- Never commit secrets (API keys, passwords, private keys, `.env` files).
- Never include sensitive or internal-only information in commit messages —
  they are part of the public record.

## Getting set up

CodeSphere is a monorepo: a React/Vite frontend and NestJS backend services
(`backend/{auth,problem,execution,assessment}-service`), a FastAPI AI service,
and a Kong-fronted Docker Compose stack. See the [README](README.md) for the
architecture overview and the local-run steps.

```bash
npm install
npm run dev            # frontend + backend in dev mode
npm run build          # build all workspaces
npm run lint           # lint all workspaces
```

## Branching and pull requests

1. Branch from `main` using a descriptive prefix:
   `feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`, `test/…`.
2. Keep each PR focused on a single concern so it is easy to review.
3. Make sure the build and lint pass before opening the PR.
4. Fill out the pull request template and describe how you verified the change.
5. A maintainer reviews and merges via squash.

## Commit messages

- Follow [Conventional Commits](https://www.conventionalcommits.org/):
  `type(scope): summary` (e.g. `fix(execution): reject path traversal`).
- Write them for a human reader — explain *what* changed and *why*.

## Code style

- Match the style of the surrounding code; run the formatter/linter.
- Add or update tests when you change behavior.
- Keep changes to the API/data layer explicit and reviewable.

## Reporting security issues

Please do **not** open a public issue for security vulnerabilities. Follow the
process in the [Security Policy](SECURITY.md).
