MADE BY ME(AK)
# FarmPrism

FarmPrism is a mobile agricultural marketplace connecting farmers, buyers, and logistics partners. Supabase is the backend and source of truth.

## Current Phase

Phase 1C common UI is in progress:

- Splash and common first-time/returning flow
- Supabase phone OTP Auth integration
- Local and Supabase language persistence
- Assigned-role loading and `last_role_id` persistence
- Farmer onboarding flow and protected Buyer/Logistics placeholder destinations
- Reusable common UI components

Business dashboards and workflows are not implemented yet.

## Technology

- Expo `~57.0.20`
- React `19.2.3`
- React Native `0.86.3`
- TypeScript `6.0.3`
- Supabase JS `2.115.0`
- React Navigation `7.3.18` and native stack `7.18.10`
- AsyncStorage `3.1.1`

## Roles

Exactly three application roles are supported:

- Farmer (`farmer`)
- Buyer (`buyer`)
- Logistics (`logistics`)

## Prerequisites

Install Node.js/npm and Git. Android development additionally requires Android Studio and an emulator or device. iOS development requires macOS and Xcode.

## Installation

```powershell
git clone <repository-url>
cd FarmPrism
git checkout Development
npm install
```

Copy `.env.example` to `.env` and configure the public Supabase URL and publishable key.

For temporary local UI testing before SMS is configured, set `EXPO_PUBLIC_MOCK_OTP=true`. This development-only mode accepts any six-digit OTP without calling Supabase OTP APIs, creates no database records, and must be disabled for real SMS testing.

## Run

```powershell
npm start
npm run android
npm run ios
npm run web
```

## Checks

```powershell
npm run typecheck
npx expo export --platform android
```

Linting and automated tests are not configured yet.

## Structure

```text
src/
  app/          providers and composition root
  components/   reusable UI
  config/       environment and role configuration
  hooks/        React hooks
  lib/          Supabase client and helpers
  navigation/  application flow and protected routes
  screens/      common flow and placeholders
  services/     Auth, preferences, and role services
  types/        shared types
  utils/        utilities
  styles/       theme exports
```

## Documentation

- [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md) - product and implementation requirements
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - setup, commands, architecture, and workflow
- [AGENTS.md](AGENTS.md) - rules for AI coding agents

## Supabase

The Supabase project and database already exist. Do not create or modify tables, migrations, SQL, or RLS policies from this repository. The mobile app uses only public/publishable client credentials; never use a service-role key.

Development work is based on the `Development` branch.
