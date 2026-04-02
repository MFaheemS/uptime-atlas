# Contributing to UptimeAtlas

Welcome, and thank you for your interest in contributing! This guide will help you get up and running quickly.

## Prerequisites

- **Node.js** v20 or later
- **pnpm** v9 or later (`npm install -g pnpm`)
- **Docker** and Docker Compose (for PostgreSQL and Redis)

## Local Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/uptime-atlas.git
   cd uptime-atlas
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start infrastructure**

   ```bash
   docker compose up -d
   ```

4. **Configure environment**

   ```bash
   cp apps/api/.env.example apps/api/.env
   # Edit apps/api/.env with your database URL and secrets
   ```

5. **Run database migrations**

   ```bash
   cd apps/api
   npx prisma migrate dev
   cd ../..
   ```

6. **Start the development servers**
   ```bash
   pnpm dev
   ```

   - API: http://localhost:3001
   - Web: http://localhost:5173

## Running Tests

**Unit tests:**

```bash
pnpm test                          # all packages
pnpm --filter @uptime-atlas/api test  # API only
pnpm --filter @uptime-atlas/web test  # web only
```

**E2E tests (Playwright):**

```bash
cd apps/web
pnpm test:e2e
```

Make sure both the API and web dev servers are running before running E2E tests.

## Code Style Guide

- **TypeScript** everywhere — no `any` unless unavoidable, and comment why
- **Formatting**: Prettier with the project defaults (run `pnpm format`)
- **Linting**: ESLint (run `pnpm lint`)
- **React**: functional components only, hooks for state/data
- **API**: Fastify routes, Zod for validation, Prisma for DB access
- Keep components small and focused — prefer composition over large monolithic files
- Write tests for any non-trivial logic

## Submitting a Pull Request

1. Fork the repository and create a branch from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. Make your changes and write tests if applicable

3. Ensure all tests pass:

   ```bash
   pnpm test
   pnpm lint
   pnpm check-types
   ```

4. Push and open a PR against `main`

5. Fill out the PR template — describe what changed and why, and include screenshots for UI changes

6. A maintainer will review and merge. We aim to respond within 48 hours.

## Reporting a Bug

Please [open an issue](https://github.com/your-org/uptime-atlas/issues/new) with:

- A clear title describing the problem
- Steps to reproduce
- Expected vs actual behavior
- Your environment (OS, Node version, browser if applicable)

We appreciate every bug report — even small ones!

---

Thank you for helping make UptimeAtlas better. Every contribution, large or small, matters.
