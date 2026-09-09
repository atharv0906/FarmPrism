# FarmPrism Agent Rules

## Mandatory reading order
1. Read `PROJECT_REQUIREMENTS.md` first.
2. Read `DEVELOPMENT_GUIDE.md` before changing architecture.
3. Inspect existing code before creating files or implementing new functionality.

## Required project constraints
- Preserve the current Expo/React Native/TypeScript architecture.
- Do not recreate existing functionality or invent requirements.
- FarmPrism has exactly three persisted roles: `farmer`, `buyer`, and `logistics`.
- One login = one permanent application role.
- There is no authenticated role switcher.
- FPO is visible only as a Coming Soon tile and is not a persisted role.
- Supabase is the source of truth for authentication, roles, preferences, and application data.
- Do not modify Supabase, create SQL migrations, change tables, or change RLS without explicit human approval.
- Never expose service-role keys, private keys, or secret credentials in frontend code or `EXPO_PUBLIC_*` values.
- Never store passwords or authentication tokens manually in app code.
- Do not use fake data when implementing real features.
- Do not implement final UI designs before approved designs are supplied.
- Keep the approved Farmer Home and My Farm implementations intact.
- Do not wire the mobile app to the Node/Express server in this phase.

## Prototype boundaries
- Current prototype auth uses `EXPO_PUBLIC_MOCK_OTP=true` and accepts any six-digit numeric OTP.
- The current prototype has nine fixed demo accounts.
- Prototype crop support is limited to Tomato, Onion, and Potato.
- Quality is currently farmer-declared A/B/C; do not describe it as certified or AI-verified.
- Auction and Fixed Price are both supported selling methods.
- Business logic for market intelligence, payment, logistics, and delivery is expected to live in the server-side API, not in the mobile app.
- Blockchain, real SMS OTP, production payment gateway, and production AI quality are future scope and must not be implemented as if they are current features.

## Quality bars
- Maintain strict TypeScript and existing service/provider/navigation boundaries.
- Keep server code separate from mobile app code unless explicitly requested.
- Do not perform destructive refactors or history operations without approval.
- Run `npm run typecheck` after meaningful changes.
- If working with the server scaffold, run `cd server` and validate with the server typecheck/build commands.
- Do not commit or push in this phase.
