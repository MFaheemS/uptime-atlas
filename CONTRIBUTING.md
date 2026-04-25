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

## Mobile Development

### Running the app locally with Expo Go

1. Install the **Expo Go** app on your iOS or Android device.

2. Start the mobile dev server:

   ```bash
   cd apps/mobile
   pnpm start
   ```

3. Scan the QR code shown in the terminal with Expo Go (Android) or the Camera app (iOS).

4. Ensure your phone and development machine are on the same WiFi network.

### Environment

The mobile app reads `EXPO_PUBLIC_API_URL` from `apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:3001
```

Replace the IP with your machine's local network IP (`ipconfig` on Windows, `ifconfig` on Mac/Linux).

### EAS Builds

[EAS (Expo Application Services)](https://expo.dev/eas) builds the app in the cloud.

**One-time setup:**

```bash
npm install -g eas-cli
eas login        # create a free account at expo.dev
cd apps/mobile
eas build:configure
```

**Build a preview APK (Android, fastest to share):**

```bash
eas build --platform android --profile preview
```

Free tier: 30 builds/month. The build takes ~10–15 minutes. Download the APK from the [Expo dashboard](https://expo.dev).

**Build profiles** (defined in `apps/mobile/eas.json`):

| Profile       | Distribution         | Notes                                  |
| ------------- | -------------------- | -------------------------------------- |
| `development` | Internal (simulator) | Includes dev client                    |
| `preview`     | Internal APK         | Fastest to install and share           |
| `production`  | Store                | For App Store / Google Play submission |

### Testing push notifications locally

1. Run the app in Expo Go on a real device (push notifications don't work in simulators).
2. Open [https://expo.dev/notifications](https://expo.dev/notifications) in a browser.
3. Enter your Expo push token (logged to the console when the app starts) and send a test notification.
4. Alternatively, take a monitored site down to trigger a real alert through the worker.

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
