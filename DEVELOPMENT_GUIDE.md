# FarmPrism Development Guide

## Current architecture

Phase 2.0.11 finalizes the working prototype. React Native / Expo / TypeScript → Node/Express business API → Supabase. Mobile API integration, Buyer/Logistics screens, demo sessions, marketplace and delivery flows are implemented. Supabase remains the persisted source of truth, real-auth RLS boundary and host of existing transactional/demo RPCs. Node owns authorization and business/integration orchestration.

The current local Development tree is authoritative. Do not reset, revert, checkout, stash, create a branch, commit or push during this phase. Preserve existing user edits and assets. Approved Farmer Home/My Farm are visually frozen; do not broadly redesign Buyer/Logistics. Current screen brief: assets/FarmPrism_Designer_Screen_MDs/INDEX.md and MASTER_FLOW.md.

## Setup

Use Node.js 22 or later and npm. Android device/emulator validation needs Android tooling; native iOS needs macOS/Xcode. Keep mobile and server packages separate.

```powershell
npm install
npm --prefix server install
```

Create root .env from .env.example with public Supabase URL/key and EXPO_PUBLIC_API_URL. Publishable key is preferred; retain legacy anon-key fallback. Development mock OTP is EXPO_PUBLIC_MOCK_OTP=true. Do not put server credentials in root .env or EXPO_PUBLIC_* variables. Never overwrite existing ignored environments with examples.

Create server/.env from server/.env.example. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are server credentials/configuration. MARKET_PROVIDER=data_gov is the supported market adapter. Unknown provider or invalid explicit config fails safely at startup.

| Server market setting | Behavior |
| --- | --- |
| MARKET_API_BASE_URL | HTTPS resource base; default https://api.data.gov.in/resource; no credentials/query/fragment |
| MARKET_API_KEY | Canonical secret key; never print or expose to mobile |
| MARKET_RESOURCE_ID | Configured resource identifier; no hardcoded default |
| MARKET_API_LIMIT | Integer 1–1000, default 100 |
| MARKET_API_TIMEOUT_MS | Integer 1–60000, default 10000 |
| DATA_GOV_IN_API_KEY | Deprecated compatibility only when MARKET_API_KEY is blank/missing |

Missing key/resource skips official requests and retains DB fallback; server startup does not require market credentials. Changing ignored server/.env requires restarting Node. Do not duplicate a configured legacy key unnecessarily. AI_PROVIDER_API_KEY/MODEL/ENDPOINT remain optional for the existing explanation gateway protocol; never assume a vendor-specific contract.

## Run

Terminal 1, repository root:

```powershell
npm run dev
```

Terminal 2:

```powershell
npm run dev:mobile
```

Health check:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

The Android emulator reaches the host at EXPO_PUBLIC_API_URL=http://10.0.2.2:3000. On a physical device use the reachable host address. Mobile commands remain npm start, npm run android, npm run ios and npm run web. Server commands can run with npm --prefix server.

## Auth and data boundaries

The nine fixed accounts and three permanent roles are listed in PROJECT_REQUIREMENTS.md. Any six-digit numeric OTP works only in development mock mode. Server-issued tokens are implemented and persist through the existing SecureStore/provider lifecycle. Requests validate the stored hash, expiry, revocation and enabled account. Logout writes revoked_at using IS NULL and a reused token is rejected. Role/account changes require sign-out, not a switcher. FPO remains Coming Soon only.

Never print raw bearer tokens, token hashes, OTPs, market/AI keys or service-role credentials. Use process-memory tokens for targeted live tests. Do not change schema, migrations, RLS or deployed functions. Business transactions use existing authorized RPCs. Unit tests must use injected/mocked dependencies, never live reset or live government data.

## Market behavior and diagnostics

The adapter preserves Maharashtra and optional district filters, validates dates and positive ordered prices, converts INR/Quintal to INR/KG, and caches normalized official observations in existing storage. Valid official results survive DB read/cache-write outages. Official outages retain honest DB observations. Never log request URLs containing api-key.

Current provenance follows the current observation, independently of historical demo inputs. Farmer sees one subtle source label and Current / Min / Max / Suggested / Next 7 Days in ₹/Quintal; no raw history, confidence, volatility or fallback diagnostics. Keep analysis internal.

Price recommendations apply the locked grade (+1.5/0/-1.5%), demand (+1.5/+0.5/0%) and quantity (0/-0.5/-1%) policy after market momentum, capped at ±3%, followed by the existing volatility width. This is deterministic contextual/statistical behavior, not trained AI or a guarantee. Optional AI may explain, never override numeric prices.

If local MARKET_API_KEY and MARKET_RESOURCE_ID exist, the targeted live market check uses a Farmer1 session through Node for Tomato, Onion and Potato, preferably Pune. Report official attempt/normalized rows, effective source, observed date and numerical validity without key/URL/token disclosure. A legitimate missing local observation with healthy fallback is not a regression.

## Development reset CLI

The existing service-role-only demo_reset_prototype_data() RPC is already deployed. The server CLI accepts exactly one confirmation argument and rejects NODE_ENV=production:

```powershell
npm --prefix server run reset:demo -- RESET_FARMPRISM_DEMO
```

It calls only that RPC and outputs whitelisted summary fields; no arbitrary SQL, table or function names and no HTTP/mobile reset surface. It clears demo sessions/transactions and restores the RPC's defined inventory/marketplace/trust scenario; static accounts/profiles/mandi data stay intact. This discards successful live E2E evidence. Do not run automatically or in unit tests. The developer must deliberately choose when to reset.

## Validation

```powershell
npm run typecheck
npm run test
npm --prefix server run typecheck
npm --prefix server run build
npm --prefix server test
npx expo export --platform android --output-dir .expo/phase-2-0-12-export
git diff --check
```

Server typecheck includes the reset CLI via tsconfig.scripts.json; normal build output stays under server/dist. Tests use mocked repositories/Supabase. Export output belongs in ignored .expo.

Targeted live logout: create Farmer1 session in memory → authenticated /api/workspace 200 → POST /api/demo/logout 200 → same token /api/workspace 401. Do not repeat full Auction/Fixed flows unless a proven regression requires it. Existing completed orders FP-11332B8B3E and FP-25A03D7831 remain evidence.

## Product constraints

Keep Tomato/Onion/Potato, Farmer Declared A/B/C, Auction and Fixed Price, accepted 10–90% Farmer advance, atomic first logistics claim, 40%/60% logistics split and OTP-as-delivery-confirmation intact. Payments and development GPS simulation must remain honestly labelled. Feedback/trust is backend-controlled. Quality declaration consistency does not mean percentage of high-grade produce; Grade C alone is not untrustworthy. Trust stays off Farmer Home.

Disputes are backend-only. Production SMS, payment gateway, genuine camera/video AI quality, blockchain, FPO and production hardening remain future scope. Preserve strict TypeScript and service/provider/hook/navigation boundaries. See PHASE_2_0_11.md for measured validation results and any remaining limitations.

## Phase 2.0.12 read and session boundaries

The Farmer summary repository scopes accounts/profiles/batches/orders/notifications by req.demoSession.accountId and auctions/bids by owned parent IDs. Both routes require requireDemoSession and requireDemoRole('farmer'). They call no legacy snapshot or expiry RPC. At 1000 rows the read fails explicitly rather than silently returning truncated totals. Summary market service injection omits optional cache writes, retaining official reads and DB fallback without writing non-demo market rows.

Mobile farmerSummary.client/contract feed the existing focus-refresh hooks and unchanged mappers. Cached data is retained on refresh error and keyed by the current token. Missing or malformed nested fields fail parsing; 401 uses existing unauthorized cleanup.

DemoSession client/service retain existing SecureStore keys. Login identity comes from POST /api/demo/session, restore identity from GET /api/demo/me. Only session credentials and cached phone are cleared on logout/revocation. mockFlow.service keeps explicit role confirmation and Farmer completion preferences separately per phone. The completion marker is written only by Review Submit; no server profile write occurs. Auth navigation uses the existing language preference for returning login.

Targeted live validation: Farmer1 session → /api/demo/me → /api/workspace → both Farmer summaries; compare eligible KG and crop groups against current workspace/DB, never seed totals. Compare market cards with the existing service; logout 200 then reuse 401. Preserve previous completed E2E orders. PHASE_2_0_12.md contains the external grant handoff; do not apply grant changes locally.
