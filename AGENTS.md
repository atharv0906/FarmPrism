# FarmPrism Agent Rules

## Read before editing

1. Read PROJECT_REQUIREMENTS.md.
2. Read DEVELOPMENT_GUIDE.md.
3. Inspect existing code and current working-tree changes before adding files or functionality.
4. Use assets/FarmPrism_Designer_Screen_MDs/INDEX.md and MASTER_FLOW.md as the current screen-behavior/design brief. Preserve the pack and distinguish implemented screens from design briefs.

## Current implementation

- Phase 2.0.11 finalizes the implemented prototype. React Native / Expo / TypeScript → Node/Express business API → Supabase.
- Mobile API integration, server-issued demo sessions and SecureStore session lifecycle are implemented.
- Farmer Home/My Farm/Sell/Insights/Profile, Buyer screens, Logistics screens and shared transaction/notification/profile flows are implemented.
- Supabase remains the persisted source of truth and real-auth RLS boundary. Existing transactional/demo RPCs enforce atomic business operations.
- Node owns demo authorization, marketplace orchestration, market adapter, price intelligence, simulated payments, logistics/GPS/OTP, feedback/trust reads and development reset CLI integration.

## Product constraints

- Exactly three persisted roles: farmer, buyer, logistics. One login = one permanent role; no authenticated role switcher.
- FPO is Coming Soon UI only, not a persisted role or Buyer subtype.
- Nine fixed demo accounts; development EXPO_PUBLIC_MOCK_OTP=true accepts any six-digit numeric OTP. Real SMS remains future scope.
- Only Tomato, Onion and Potato. Internal KG and INR/KG; Farmer market display primarily INR/Quintal.
- Quality is Farmer Declared A/B/C, never certified or AI Verified.
- Auction and Fixed Price are implemented. Preserve bid revision/history, partial acceptance, inventory reconciliation, Buyer advance 10–90%, atomic first logistics claim, fee acceptance, 40%/60% logistics payments and OTP verification as delivery confirmation.
- Full Auction and Fixed Price live E2E already passed. Do not rebuild or alter these flows unless a regression proves a defect.
- Trust is backend-controlled. Quality declaration consistency is independent of grade; Grade C alone is not untrustworthy. Keep Trust Score off Farmer Home.
- Preserve approved Farmer Home and My Farm visuals. No broad Buyer/Logistics redesign in this phase.
- Farmer Price Insight remains Current / Min / Max / Suggested / Next 7 Days. No raw history, confidence, volatility, buyer-signal counts or developer fallback diagnostics.
- Price contextual adjustment follows the documented policy, capped at ±3%, with market statistics dominant. Optional AI explains only; do not invent a vendor contract or trained-model claims.
- Disputes remain backend-only. Blockchain, production SMS/payment gateway, FPO and genuine camera/video AI quality remain future scope; no fake hashes or certification.

## Security and change boundaries

- Do not change Supabase schema, migrations, RLS or deployed RPC definitions in this phase. The trust correction and demo_reset_prototype_data RPC already exist externally.
- Never expose service-role keys, market/AI secrets, raw bearer tokens or OTPs in frontend code, EXPO_PUBLIC_* values or logs.
- Preserve the existing SecureStore/provider token lifecycle; never add ad hoc password/token storage.
- Keep root/server ignored .env private and unchanged unless an explicitly needed migration is authorized. Tracked .env.example files are blank templates with safe defaults only.
- Government credentials belong only in server/.env. MARKET_API_KEY is canonical; DATA_GOV_IN_API_KEY is deprecated blank/missing-key fallback. Missing market configuration must preserve DB fallback.
- The reset CLI is development-only, requires exactly RESET_FARMPRISM_DEMO and calls only the existing reset RPC. Do not run live reset automatically or from tests; retain E2E data until the developer deliberately chooses reset.
- Do not manufacture runtime business data or recreate existing functionality.
- Work in the current local Development tree. Preserve pre-existing edits. Do not reset, revert, checkout, stash, create a branch, commit, push or rewrite Git history during this phase.

## Quality bars

- Maintain strict TypeScript and service/provider/hook/navigation boundaries; keep server and mobile dependencies separate.
- Use mocked/injected dependencies for unit tests, never live Supabase reset or live data.gov.in.
- Run npm run typecheck and npm run test.
- Run npm --prefix server run typecheck, npm --prefix server run build and npm --prefix server test.
- Run npx expo export --platform android --output-dir .expo/phase-2-0-12-export and git diff --check.
- Report measured validation and exact live failures honestly. Never claim UI/device verification from API-only checks.

## Phase 2.0.12 boundaries

- Farmer Home/My Farm summaries are Node-authoritative; preserve strict clients, focus refresh and frozen visuals/mappers. Do not restore direct mobile snapshot RPCs or fake unsupported My Farm writes.
- Mock account identity comes from session creation and /api/demo/me restoration. Keep existing SecureStore lifecycle and reject revoked sessions.
- Fresh accounts require explicit assigned-role confirmation. Farmer completion is local per-account UX state written only on Submit, preserved with remembered roles on logout; it is not a profile write.
- Five retired mobile RPC anon/authenticated grants await external owner revocation. Retain service_role and do not change grants/schema/RLS/RPC definitions.
