# PilotForms™ SaaS Platform

A subscription-based mobile SaaS platform that digitises aviation paperwork for pilots. Pilots complete, sign, and export forms on iOS and Android — even offline. Administrators manage form templates and monitor users through a Next.js web dashboard.

---

## Repository Structure

```
pilotforms/
├── apps/
│   ├── mobile/          # React Native + Expo (iOS & Android)
│   └── admin/           # Next.js 14 Admin Dashboard
├── packages/
│   └── shared/          # Domain types, interfaces, and utilities
├── supabase/            # Migrations, edge functions, seed data (Task 2)
├── .env.example         # Environment variable template
├── turbo.json           # Turborepo pipeline config
└── package.json         # Root workspace config
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + Expo (TypeScript) |
| Admin Dashboard | Next.js 14 + App Router + Tailwind CSS |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Shared Types | TypeScript packages/shared |
| State (mobile/admin) | TanStack Query + Zustand |
| Offline DB | Expo SQLite |
| PDF Export | react-native-html-to-pdf + pdf-lib (edge function) |
| Subscriptions | RevenueCat (App Store + Play Store) |
| Build System | Turborepo |

---

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- [Turborepo](https://turbo.build) (`npm install -g turbo`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-org/pilotforms.git
cd pilotforms
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local and fill in your Supabase project credentials
```

### 3. Start local Supabase

```bash
supabase start
# Outputs local API URL, anon key, and service role key — add to .env.local
supabase db reset   # Applies migrations and seed data
```

### 4. Run all apps (development)

```bash
turbo dev
```

Or run individual workspaces:

```bash
turbo dev --filter=@pilotforms/admin    # Next.js admin at http://localhost:3000
turbo dev --filter=@pilotforms/mobile   # Expo dev server
```

---

## Available Scripts

These scripts are wired through Turborepo and run across all workspaces:

| Script | Description |
|---|---|
| `npm run build` | Production build for all apps and packages |
| `npm run dev` | Start all apps in development mode |
| `npm run test` | Run test suites across all workspaces |
| `npm run lint` | ESLint across all workspaces |
| `npm run typecheck` | TypeScript type checking across all workspaces |
| `npm run format` | Prettier format all source files |
| `npm run format:check` | Check formatting without writing |
| `npm run clean` | Remove all build artifacts and node_modules |

---

## Workspace Scripts

Each workspace also exposes the same scripts locally:

```bash
# Admin dashboard
cd apps/admin
npm run dev          # http://localhost:3000
npm run build
npm run test
npm run lint
npm run typecheck

# Mobile app
cd apps/mobile
npm run start        # Expo dev server
npm run ios
npm run android
npm run test
npm run lint
npm run typecheck

# Shared package
cd packages/shared
npm run build
npm run test
npm run typecheck
```

---

## Architecture

The platform follows Clean Architecture with a strict dependency rule:

```
Presentation Layer  →  Domain Layer  ←  Data Layer
(screens/pages)       (entities/     (repositories/
                       use-cases/     data-sources)
                       interfaces)
```

The Domain Layer has **zero** dependencies on Supabase, SQLite, or any framework. All
external dependencies are injected through interfaces defined in the domain.

---

## Supabase Commands

```bash
supabase start           # Start local Supabase stack
supabase stop            # Stop local stack
supabase db reset        # Re-run all migrations + seed data
supabase db push         # Push local migrations to remote project
supabase functions serve # Run edge functions locally
supabase gen types typescript --local > packages/shared/src/types/supabase.ts
```

---

## Contributing

1. Branch from `main`: `git checkout -b feat/your-feature`
2. Commit with conventional commits: `feat:`, `fix:`, `chore:`, etc.
3. Open a PR — CI must pass (lint + typecheck + tests) before merge

---

## License

Proprietary — PilotForms™. All rights reserved.
