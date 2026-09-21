# FarmPrism Development Guide

## Current architecture

Current phase: [2.0.19 — Auction Allow Partial Sale](PHASE_2_0_19.md). No Phase 2.0.18 auction re-entry fix existed at the starting HEAD; this phase adds only the admin utility described below.

Phase 2.0.17 deploys and validates the database contracts for the unchanged Phase 2.0.16 application. React Native / Expo / TypeScript → Node/Express business API → Supabase. Mobile API integration, Buyer/Logistics screens, demo sessions, marketplace and delivery flows are implemented. Supabase remains the persisted source of truth, real-auth RLS boundary and host of existing transactional/demo RPCs. Node owns authorization and business/integration orchestration.

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

The FarmPrism Admin portal is a prototype-only browser tool for Buyer verification. It is not a fourth application role. Buyer verification updates the existing backend verification status, and marketplace participation remains restricted to verified Buyers.

Open http://localhost:3000/admin with the existing Node server running. Configure ADMIN_USERNAME=admin and ADMIN_PASSWORD=admin in server/.env; only these two missing entries were appended for this phase, preserving other private values. Matching non-production defaults and server/.env.example entries are provided. admin/admin is prototype-only and is not suitable for production. Production has no implicit credential defaults; this does not make the portal production-ready.

POST /api/admin/login returns a random temporary token and expiresAt. Use Authorization: Bearer with that token for GET /api/admin/buyers?status=all|pending|verified|failed, POST /api/admin/buyers/:accountId/verify and POST /api/admin/logout. Credentials are checked on Node with fixed-length hash comparisons. Session hashes/expiry live only in process memory for eight hours; restart revokes all sessions. Expired sessions are pruned and the map is bounded. No mobile demo-session entries are created. sessionStorage contains only the temporary admin token.

Static HTML/CSS/JS live in server/public/admin and are served by both source and compiled Express entrypoints. Deploy that public directory alongside dist. No frontend build or new dependency is required. The UI uses same-origin Node APIs, textContent for database text, a restrictive CSP and no-store responses. AdminRepository selects explicit fields from demo_buyer_profiles with an inner Buyer-only demo_accounts join; verify writes only status/timestamp after checking that same join. At 1000 returned records it fails rather than silently truncating the prototype list.

No schema/grant/RPC migration or live Buyer mutation is needed. Verify supports failed → verified; no Mark Failed action is implemented. Existing marketplace RPC gates stay unchanged. Application tests inject dependencies; browser transition checks use a separately labelled in-memory localhost fixture, never a fabricated live Buyer. Live reads confirm the actual three verified accounts. No rate limiting, durable/multi-process admin session store, audit trail, MFA or production authentication is claimed.

The nine fixed accounts and three permanent roles are listed in PROJECT_REQUIREMENTS.md. Any six-digit numeric OTP works only in development mock mode. Server-issued tokens are implemented and persist through the existing SecureStore/provider lifecycle. Requests validate the stored hash, expiry, revocation and enabled account. Logout writes revoked_at using IS NULL and a reused token is rejected. Role/account changes require sign-out, not a switcher. FPO remains Coming Soon only.

Never print raw bearer tokens, token hashes, OTPs, market/AI keys or service-role credentials. Use process-memory tokens for targeted live tests. Only the explicitly authorized Phase 2.0.17 database changes and rollback-only validation were permitted; preserve the deployed migration. Business transactions use existing authorized RPCs. Unit tests must use injected/mocked dependencies, never live reset or live government data.

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
npx expo export --platform android --output-dir .expo/partial-sale-toggle-validation
git diff --check
```

Server typecheck includes the reset CLI via tsconfig.scripts.json; normal build output stays under server/dist. Tests use mocked repositories/Supabase. Export output belongs in ignored .expo.

Targeted live logout: create Farmer1 session in memory → authenticated /api/workspace 200 → POST /api/demo/logout 200 → same token /api/workspace 401. Do not repeat full Auction/Fixed flows unless a proven regression requires it. Existing completed orders FP-11332B8B3E and FP-25A03D7831 remain evidence.

## Product constraints

Keep Tomato/Onion/Potato, Farmer Declared A/B/C, Auction and Fixed Price, accepted 10–90% Farmer advance, atomic first logistics claim, 40%/60% logistics split and OTP-as-delivery-confirmation intact. Payments and development GPS simulation must remain honestly labelled. Feedback/trust is backend-controlled. Quality declaration consistency does not mean percentage of high-grade produce; Grade C alone is not untrustworthy. Trust stays off Farmer Home.

Disputes are backend-only. Production SMS, payment gateway, genuine camera/video AI quality, blockchain, FPO and production hardening remain future scope. Preserve strict TypeScript and service/provider/hook/navigation boundaries. See PHASE_2_0_11.md for measured validation results and any remaining limitations.

## Phase 2.0.12 read and session boundaries

Phase 2.0.17 permits the scoped live migration and isolated SQL tests that always ROLLBACK. Application suites still use mocked/injected dependencies. Do not run reset/cleanup/seed commands, create sessions or mutate retained scenarios. See PHASE_2_0_17.md for measured results.

The Farmer summary repository scopes accounts/profiles/batches/orders/notifications by req.demoSession.accountId and auctions/bids by owned parent IDs. Both routes require requireDemoSession and requireDemoRole('farmer'). They call no legacy snapshot or expiry RPC. At 1000 rows the read fails explicitly rather than silently returning truncated totals. Summary market service injection omits optional cache writes, retaining official reads and DB fallback without writing non-demo market rows.

Mobile farmerSummary.client/contract feed the existing focus-refresh hooks and unchanged mappers. Cached data is retained on refresh error and keyed by the current token. Missing or malformed nested fields fail parsing; 401 uses existing unauthorized cleanup.

DemoSession client/service retain existing SecureStore keys. Login identity comes from POST /api/demo/session, restore identity from GET /api/demo/me. Only session credentials and cached phone are cleared on logout/revocation. mockFlow.service keeps explicit role confirmation and Farmer completion preferences separately per phone. The completion marker is written only by Review Submit; no server profile write occurs. Auth navigation uses the existing language preference for returning login.

Historical Phase 2.0.12 live-validation procedure (not authorized in Phase 2.0.16): Farmer1 session → /api/demo/me → /api/workspace → both Farmer summaries; compare eligible KG and crop groups against current workspace/DB, never seed totals. Compare market cards with the existing service; logout 200 then reuse 401. Preserve previous completed E2E orders. The five retired mobile RPC grants documented in PHASE_2_0_12.md have already had anon/authenticated EXECUTE revoked externally; service_role remains. Do not apply grant changes locally.

## Phase 2.0.14 restored My Farm writes

POST /api/farmer/crops creates a first current crop batch; POST /api/farmer/batches adds a separate batch to a current crop; PATCH /api/farmer/farm updates whitelisted existing profile fields. All routes require a Farmer session and use only its account ID. Clients preserve existing token/401 handling. Inventory starts with null grade and quality notes, farmer_declared source and available status; the existing Sell Quality route owns grade declaration.

The service serializes crop checks/inserts per account/crop within one Node process. Multi-replica deployment needs database transaction/locking work before relying on this guard; schema changes are outside this phase. Activities use actual batch timestamps, without claiming a persisted farm-edit log. Summary DTOs include safe batch details and nullable saved coordinates, with strict client validation.

Preserve tester sessionStorage (web AsyncStorage, native SecureStore), AuthProvider lifecycle, ProtectedRoute Splash fallback and Home rendering changes. Preserve batched historyMany through repository/service/summary; summary injection includes both read methods and excludes cache writes. Development CORS retains its four localhost origins and additionally permits PATCH. No dependencies or environment files change. Main Farmer Home/My Farm layout and assets remain frozen.

## Phase 2.0.17 deployed handoff and expiry contract

- Pickup: Buyer pays 40% logistics advance; the order Farmer generates/regenerates a six-digit Pickup OTP only while order = logistics_advance_paid and assigned job = advance_paid. Only assigned Logistics verifies it; verification itself sets order/job = pickup_confirmed and enables tracking. OTP display is component memory only. Delivery OTP remains the delivery confirmation step.
- The deployed pickup RPCs own hashed storage, 15-minute expiry, five wrong attempts, regeneration resetting attempts, ownership/state validation and event/notification writes. No SMS or extra pickup confirmation step.
- Accepted allocation is already deducted: a 650 KG batch with a 200 KG order keeps its 450 KG available source remainder during pickup. Only the order allocation travels; mobile performs no subtraction/status write.
- Auction Option A: 6/12/24 hours, default 24. Open and partially_sold expire at ends_at; unaccepted active/partially-accepted bid remainder goes to history and cannot be accepted. Accepted orders remain valid, no auto-award, unsold remainder is relistable.
- On an expiry invocation during the last hour, actionable unaccepted bids trigger one idempotent Farmer in-app warning; auctions with no actionable bids get none. No database scheduler was found; exact one-hour delivery is not guaranteed. Expiry with unsold quantity triggers one in-app expiry notification. Deployed demo_expire_marketplace owns creation/deduplication; mobile supports auction_expiring and auction_expired with entity_type = auction, entity_key = auction ID, data.auctionId = auction ID. No push infrastructure.
- Quality declaration consistency covers produce entering the selling/listing workflow, not all stored inventory. Unlisted grade-null batches are not a trust failure; A/B/C declarations have equal trust meaning. Nullable trust stays backend-controlled and off Farmer Home.
- Deployed and rollback-tested: demo_generate_pickup_otp, demo_verify_pickup_otp_v2, demo_expire_marketplace and demo_recalculate_trust. Auction and Fixed Price acceptance check clock_timestamp() after row locks; active/partially_sold listings expire with unaccepted request remainder. The old demo_confirm_pickup RPC is denied to all API roles and its owner-call stub raises PICKUP_OTP_REQUIRED. See PHASE_2_0_17.md for security and validation limits.

### Integration and verification boundary

POST /api/farmer/orders/:orderId/pickup-otp calls demo_generate_pickup_otp(p_farmer_account_id, p_order_id).
POST /api/logistics/orders/:orderId/verify-pickup calls demo_verify_pickup_otp_v2(p_logistics_account_id, p_order_id, p_otp).
Actor IDs come only from the session. INVALID_OTP and OTP_ATTEMPTS_EXCEEDED expose safe attempt counts. The old direct pickup route/client/command is retired; stale requests receive 404.

Node retains its auction preflight. Deployed auction and Fixed Price acceptance RPCs now check wall-clock deadlines after row locks. Workspace/marketplace and listing creation paths invoke expiry; no pg_cron extension or cron.job exists. Warnings require an invocation during the last hour, so exact delivery without reads is not guaranteed. No scheduler or push service was added.

Use mocked/injected RPCs and market fetches for application tests; the explicit supabase/tests SQL validations require a transaction ending in ROLLBACK. Never exercise these commands on the retained Farmer2/Buyer1 scenario. Expo export and component tests are not device or live E2E verification. Market historyMany keeps one stored batch read and retains official observations if that read fails.

## Phase 2.0.19 Auction partial-sale policy

Every Auction has an immutable `Allow Partial Sale` setting selected by the Farmer before publishing. It defaults ON. When ON, existing partial-bid/partial-acceptance behavior applies. When OFF, Buyers must bid for the complete Auction lot and the Farmer may accept only the complete lot. Buyer quantity remains visible but non-editable. Fixed Price is unaffected.

The scoped migration `20260921193152_phase_2_0_19_auction_partial_sale.sql` is deployed. Do not replay it. Existing Auctions default ON; published policy changes are rejected by a database trigger. Create, bid and accept RPCs retain service-role-only execution. Auction workspace DTOs require an explicit boolean; missing or malformed policies fail parsing.

The starting Phase 2.0.18 application/database still blocks new bids on `partially_sold` Auctions. This pre-existing re-entry limitation is preserved, not represented as fixed. Existing eligible bid remainder can still be accepted before expiry. See PHASE_2_0_19.md for measured validation and limits.
