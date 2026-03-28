# UptimeAtlas

**AI-powered website monitoring platform**

---

## About

UptimeAtlas is a full-stack, AI-powered platform that monitors website uptime, performance, and anomalies in real time. It alerts you the moment something goes wrong and uses AI to help diagnose root causes.

## Features

- Real-time uptime monitoring
- AI-powered anomaly detection and root cause analysis
- Multi-region checks
- Incident timeline and history
- Alerting via email, Slack, and webhooks
- Mobile app for on-the-go visibility

> More features coming soon.

## Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Monorepo | Turborepo + pnpm workspaces      |
| API      | Node.js + Fastify + TypeScript   |
| Web      | Next.js + React + TypeScript     |
| Mobile   | React Native + Expo              |
| Worker   | Node.js background job processor |
| Shared   | Shared types and utilities       |
| AI       | Groq API                         |
| Database | PostgreSQL                       |
| Cache    | Redis                            |
| Auth     | JWT                              |

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9

### Install

```bash
git clone https://github.com/your-org/uptime-atlas.git
cd uptime-atlas
pnpm install
```

### Configure environment

```bash
cp .env.example .env
# Fill in the values in .env
```

### Run in development

```bash
pnpm dev
```

## Architecture

> Architecture diagram and detailed documentation coming soon.

The monorepo is organized as:

```
uptime-atlas/
  apps/
    api/        # REST API server
    web/        # Next.js web dashboard
    mobile/     # React Native mobile app
    worker/     # Background monitoring workers
  packages/
    shared/     # Shared types, utilities, constants
```

## License

MIT — see [LICENSE](./LICENSE)
