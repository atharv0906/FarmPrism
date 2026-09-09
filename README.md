# FarmPrism

FarmPrism is a mobile agricultural marketplace for farmers, buyers, and logistics partners. The app is currently structured around a React Native / Expo mobile client, Supabase for auth and persisted application data, and a separate Node/Express TypeScript API scaffold for future business and integration logic.

## Current Phase

This repository is in the current prototype architecture and documentation update phase. The current local worktree is the source of truth, and the app must preserve working Farmer Home and My Farm flows while adding only infrastructure and documentation groundwork.

Current prototype scope includes:

- Expo/React Native application foundation
- Supabase-backed auth and role flow
- Demo prototype auth with fixed phone accounts and mock OTP
- Existing approved Farmer Home and My Farm screens
- Architecture and server scaffold for later business services

Current prototype does not include:

- full buyer/logistics screen buildout
- production SMS OTP
- blockchain features
- production payment gateway integration
- final buyer/logistics product UIs
- real external AI/service integration in the app

## Technology

- Expo
- React Native
- TypeScript
- React Navigation
- Supabase JS
- Node.js / Express / TypeScript server scaffold

## Role Model

FarmPrism supports exactly three persisted application roles:

- farmer
- buyer
- logistics

Important constraints:

- One login = one permanent application role.
- A user does not have multiple active application roles.
- There is no authenticated role switcher.
- Changing role/account requires sign out and another login.
- FPO is visible as a Role Selection tile only and is marked as Coming Soon.
- FPO is not a persisted fourth role and is not added to the database enum.

## Authentication and Demo Prototype

For the current prototype, the app uses `EXPO_PUBLIC_MOCK_OTP=true` in development.

Any numeric 6-digit OTP is accepted in mock mode. The fixed demo accounts are:

- farmer1 / +919000000001 / Atharva Kharat
- farmer2 / +919000000002 / Farmer Two
- farmer3 / +919000000003 / Farmer Three
- buyer1 / +919000000011 / Demo Restaurant Buyer
- buyer2 / +919000000012 / Demo Wholesaler Buyer
- buyer3 / +919000000013 / Demo Buyer Three
- logistics1 / +919000000021 / Logistics One
- logistics2 / +919000000022 / Logistics Two
- logistics3 / +919000000023 / Logistics Three

This is a prototype demo/auth layer only. A server-issued internal demo session token will be introduced later for mutation authorization. Real Supabase SMS OTP remains future production scope.

## Crops and Units

The prototype marketplace supports exactly these crops:

- Tomato
- Onion
- Potato

No additional crop is part of the current prototype. All quantities are stored internally in kilograms. Display uses the convention: 100 KG = 1 Quintal.

## Farmer Home and My Farm

The approved Farmer Home screen is already implemented and must remain frozen. It owns the existing dashboard behavior and quick actions, but it does not include a Trust Score.

My Farm is the dedicated authenticated root for "What I have". The current implementation is the approved, working version and should be preserved. It focuses on:

- Total Land
- Crops
- Available to Sell
- Active Batches

The following concepts are intentionally not present in the current My Farm version and must not be restored:

- Soil Health
- Irrigation
- Crop-wise cultivated area
- Expected Yield
- Harvest Date
- Farm Photos
- bottom branding banner

## Selling Methods

The app supports exactly two selling methods:

- Auction
- Fixed Price

Auction flow includes reserve/minimum selection, partial quantity acceptance, buyer bid revision and withdrawal, and farmer-side accepting/rejecting/closing behavior. Fixed-price flow includes a farmer-set fixed price, buyer request quantity, and advance terms with partial quantity support.

## Quality and Market Intelligence

Current prototype quality is farmer-declared. The supported prototype grades are:

- Grade A
- Grade B
- Grade C

The app must not present this as AI Verified or Certified unless a genuine verification pipeline is implemented.

Market and AI price intelligence are coordinated through the Node/Express business API, with AGMARKNET / data.gov.in as the primary official source. Historical view windows include 30/60/90 day windows with a next-7-day recommendation horizon. The app must not hardcode fake selling-price recommendations directly in JSX.

## Buyer, Logistics, and Orders

The app is designed for buyer and logistics flows, but those screens are not implemented in this phase. The prototype architecture still supports:

- orders created from accepted auction bids or fixed-price requests
- logistics assignment and fee flows
- delivery OTP and GPS tracking architecture
- trust-score computation and feedback as backend-calculated values

## Security and Server Boundary

The mobile app uses only the Supabase public/publishable key. The Node/Express server may use privileged credentials when necessary, but those credentials must never be sent to React Native or stored in `EXPO_PUBLIC_*` values.

Secrets must never be logged, including OTPs, session tokens, service-role keys, and external API keys.

## Node/Express Scaffold

This repository includes a minimal server workspace under `server/`.

The server scaffold is intentionally small and suitable for future integration:

- Express + TypeScript
- health route at `GET /health`
- public environment example file with placeholders only
- application and middleware structure for later business API work

The mobile app is not yet wired to this server; the server is a future integration boundary and documentation contract only.

## Important Documentation Rule

The current authoritative source is:

- FarmPrism Detailed Walkthrough Architecture v5
- latest explicit project decisions recorded in this repository

Older product screenshots and stale README notes are visual references only and cannot override the current explicit architecture decisions.

## Validation

Run the following before finishing work:

```powershell
npm run typecheck
cd server
npm install
npm run typecheck
cd ..
git diff --check
```

Do not commit or push from this phase.

## Project Documents

- [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md)
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md)
- [AGENTS.md](AGENTS.md)

## Repository Notes

- Keep the current Expo/React Native app structure intact.
- Do not modify Supabase tables, RLS, or migrations.
- Do not change the working Farmer Home or My Farm functionality.
- Keep demos and prototype behavior clearly separated from future production scope.
