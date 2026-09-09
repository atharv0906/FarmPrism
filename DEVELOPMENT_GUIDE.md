# FarmPrism Development Guide

## 1. Project Status

Phase 2.0.4 implements the existing atomic RPC mutation routes and typed mobile
API methods; the Farmer screens remain unwired and unchanged. The current
implementation contract and known database limitation are documented in
[server/PHASE_2_0_4.md](server/PHASE_2_0_4.md). Older scaffold-only phase
descriptions below are historical. Run root typecheck and server typecheck,
build, and tests; tests mock Supabase and require no real credentials.
This repository is an Expo/React Native mobile app with a Supabase-backed auth and data boundary and a minimal Node/Express server scaffold. The current local worktree is the source of truth. Do not reset, revert, or switch branches during this phase.

The app is currently in prototype architecture and documentation groundwork. Existing Farmer Home and My Farm functionality must continue working without redesign or regression.

## 2. Prerequisites
- Node.js and npm
- Git
- Android Studio and a device or emulator for Android validation
- macOS and Xcode for iOS builds
- Expo tooling

## 3. Setup

### Mobile app
```powershell
git checkout Development
npm install
```

Create a local environment file for the app with the required public Supabase values. Example keys:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_MOCK_OTP=true
```

Keep the app environment public-only. Never use a service-role key in the Expo app or in `EXPO_PUBLIC_*` values.

### Server scaffold
```powershell
cd server
npm install
```

The server has its own environment file based on `.env.example` and uses only placeholder values in the repository. No real credentials are checked in.

## 4. Start Commands

### Mobile
```powershell
npm start
npm run android
npm run ios
npm run web
```

### Server
```powershell
cd server
npm run dev
```

## 5. Current Implemented Truth
The current app is aligned to the following decisions:

- exactly three application roles: farmer, buyer, logistics
- one login = one permanent role
- FPO is Coming Soon only; not persisted as a fourth role
- mock OTP is the current prototype auth path
- nine fixed demo accounts exist for prototype flows
- only Tomato, Onion, and Potato are in the current marketplace prototype
- 100 KG = 1 Quintal for display formatting
- Farmer Home is frozen and preserved
- My Farm is the current approved root for “What I have”
- Auction and Fixed Price are both part of the supported selling model
- quality is currently farmer-declared A/B/C
- AGMARKNET / data.gov.in is the primary market-data direction
- Node/Express owns business logic; App does not yet call this server
- blockchain is deferred
- real SMS, payment gateway, and camera/video AI pipelines are future scope

## 6. Architecture Summary

```text
src/
  app/
  components/
  config/
  hooks/
  lib/
  navigation/
  screens/
  services/
  types/
  utils/
  styles/
```

The app uses:
- Expo + React Native + TypeScript
- React Navigation
- Supabase client for auth and data access
- local demo/prototype services for working mock flows

The server scaffold is separate:

```text
server/
  src/
    app.ts
    server.ts
    config/
    routes/
    middleware/
    types/
    services/
```

## 7. Supabase and Security Boundaries
Supabase remains the source of truth for:
- Auth
- roles
- preferences
- application data
- RLS boundary for real authenticated users

Do not modify Supabase schema, tables, migrations, or RLS from this codebase. The mobile app must not include a service-role key.

The server may use service-role and integration credentials in its own environment only.

## 8. Validation Commands
Run these after meaningful changes:

```powershell
npm run typecheck
```

Server validation:

```powershell
cd server
npm install
npm run typecheck
npm run build
```

Repository validation:

```powershell
git diff --check
```

Do not commit or push during this phase.

## 9. Debugging Guidance
When debugging auth or role issues, verify:
- the public Supabase values in the Expo app
- whether mock OTP is enabled
- the assigned demo account / phone mapping
- role persistence and auth restore flow
- the current worktree state before editing

When debugging server issues, validate the Express health route and ensure no real credentials are placed in the repository.

## 10. Future Scope Boundaries
The following remain clearly out of scope for current work:
- real SMS OTP
- camera/video AI quality verification
- production payment gateway
- blockchain
- FPO role implementation
- final buyer/logistics UI overhaul
- production deployment hardening

These are future phases and should be documented as such rather than implemented in the prototype.

## 11. Rule Summary for Code Changes
- keep the mobile architecture intact
- do not redesign the approved Farmer Home or My Farm
- do not create or modify Supabase schema, migrations, or RLS
- do not introduce server dependencies into the mobile app
- do not add fake production features disguised as real functionality
- keep the server scaffold minimal and isolated
- preserve working functionality while making only architecture and docs groundwork changes
