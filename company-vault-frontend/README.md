# Company Vault — Frontend

Company Vault is a company-wide knowledge and document assistant. An administrator signs in with Google,
connects a Google Drive folder, synchronizes documents, browses what has been indexed, and asks questions
through a department-aware AI chatbot.

This package is the frontend MVP: an Expo (React Native + React Native Web) app that runs on web, Android,
and iOS from a single codebase. It talks to the backend exclusively over REST and never touches the Google
Drive API directly.

## Tech stack

React Native · Expo · Expo Router · TypeScript (strict) · React Native Web · TanStack Query ·
React Hook Form · Zod · Axios · Expo SecureStore · Jest · React Native Testing Library

## Getting started (Docker — no local Node needed)

The whole dev workflow runs in Docker; nothing needs installing on the host beyond Docker itself.

```bash
docker compose up -d dev
```

Open `http://localhost:8081`.

**Hot reload does not work in this container on Windows** (Docker Desktop doesn't propagate filesystem
change events for a Windows bind mount into the Linux container, and Metro has no reliable polling
fallback for it — this was tested, not assumed). After editing source, refresh with:

```bash
docker compose restart dev
```

then reload the browser tab.

Run tests / typecheck the same way, as one-off commands against the same image:

```bash
docker compose run --rm dev npm run test
docker compose run --rm dev npm run typecheck
docker compose run --rm dev npm run test -- tests/ChatScreen.test.tsx   # single file
```

Production-style build (static web export served by nginx, no watch/rebuild behavior needed since it's a
one-shot build):

```bash
docker compose up --build web
```
Open `http://localhost:8080`.

Android and iOS can't run through Docker (no simulator/device access from inside a Linux container, and
iOS specifically requires macOS) — those need Node installed locally (`npm install`, then `npm run android`
/ `npm run ios`).

## Getting started (local Node, alternative)

If you'd rather develop locally with real hot reload:

```bash
npm install
cp .env.example .env   # then adjust EXPO_PUBLIC_API_BASE_URL if needed
npm run start   # or: npm run web / npm run android / npm run ios
npm run test
npm run typecheck
```

## Current state: mocked backend

There is no backend wired up yet. Every screen is driven by typed mock services in `src/mocks/*`
(with artificial network latency) behind a stable service layer in `src/services/*`. When the real
FastAPI backend is available, only the implementations in `src/services/*` need to change to call
`apiClient` (see `src/services/apiClient.ts`) — screens, hooks, and components are unaffected.

## Project structure

```text
app/                  Expo Router routes (thin — real logic lives in src/features)
  login.tsx
  (app)/               protected shell: dashboard, documents, drive, chat, settings
src/
  components/          common/ layout/ feedback/ — shared, reusable UI primitives
  features/            one folder per domain: auth, dashboard, documents, drive, chat, settings
  services/            the stable API surface (currently backed by src/mocks)
  mocks/               typed mock data + mock service implementations
  hooks/                cross-cutting hooks (auth, responsive layout)
  types/               shared domain types (kept in sync with the backend contract)
  constants/           theme, nav config, env
tests/                 Jest + React Native Testing Library specs
```

See the repository root `CLAUDE.md` for the full architecture notes shared with the backend.
