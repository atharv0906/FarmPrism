# FarmPrism Agent Rules

## Read before editing

1. Read PROJECT_REQUIREMENTS.md.
2. Read DEVELOPMENT_GUIDE.md.
3. Inspect existing code and current working-tree changes before adding files or functionality.
4. Use assets/FarmPrism_Designer_Screen_MDs/INDEX.md and MASTER_FLOW.md as the current screen-behavior/design brief. Preserve the pack and distinguish implemented screens from design briefs.

## Current implementation

- Phase 2.0.17 completes the deployed database contracts for the unchanged Phase 2.0.16 application. React Native / Expo / TypeScript → Node/Express business API → Supabase.
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

- Phase 2.0.17 explicitly authorized the scoped Pickup OTP, deadline, expiry and declaration-scope trust migration. It is deployed; see PHASE_2_0_17.md. Do not replay it or make unrelated database changes. The existing demo_reset_prototype_data RPC stays untouched.
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
- Run npx expo export --platform android --output-dir .expo/phase-2-0-17-export and git diff --check.
- Report measured validation and exact live failures honestly. Never claim UI/device verification from API-only checks.

## Current read/session and Phase 2.0.16 boundaries

- Farmer Home/My Farm summaries are Node-authoritative; preserve strict clients, focus refresh and frozen visuals/mappers. My Farm Add Crop/Add Produce/Edit Farm and eleven secondary routes are implemented through Node. Preserve these writes; do not restore direct mobile snapshot RPCs.
- Mock account identity comes from session creation and /api/demo/me restoration. Keep existing SecureStore lifecycle and reject revoked sessions.
- Fresh accounts require explicit assigned-role confirmation. Farmer completion is local per-account UX state written only on Submit, preserved with remembered roles on logout; it is not a profile write.
- Five retired mobile RPC anon/authenticated EXECUTE grants have already been revoked externally. Retain service_role and do not change grants/schema/RLS/RPC definitions.

## Phase 2.0.17 deployed handoff and expiry contract

- Pickup: Buyer pays 40% logistics advance; the order Farmer generates/regenerates a six-digit Pickup OTP only while order = logistics_advance_paid and assigned job = advance_paid. Only assigned Logistics verifies it; verification itself sets order/job = pickup_confirmed and enables tracking. OTP display is component memory only. Delivery OTP remains the delivery confirmation step.
- The deployed pickup RPCs own hashed storage, 15-minute expiry, five wrong attempts, regeneration resetting attempts, ownership/state validation and event/notification writes. No SMS or extra pickup confirmation step.
- Accepted allocation is already deducted: a 650 KG batch with a 200 KG order keeps its 450 KG available source remainder during pickup. Only the order allocation travels; mobile performs no subtraction/status write.
- Auction Option A: 6/12/24 hours, default 24. Open and partially_sold expire at ends_at; unaccepted active/partially-accepted bid remainder goes to history and cannot be accepted. Accepted orders remain valid, no auto-award, unsold remainder is relistable.
- On an expiry invocation during the last hour, actionable unaccepted bids trigger one idempotent Farmer in-app warning; auctions with no actionable bids get none. No database scheduler was found; exact one-hour delivery is not guaranteed. Expiry with unsold quantity triggers one in-app expiry notification. Deployed demo_expire_marketplace owns creation/deduplication; mobile supports auction_expiring and auction_expired with entity_type = auction, entity_key = auction ID, data.auctionId = auction ID. No push infrastructure.
- Quality declaration consistency covers produce entering the selling/listing workflow, not all stored inventory. Unlisted grade-null batches are not a trust failure; A/B/C declarations have equal trust meaning. Nullable trust stays backend-controlled and off Farmer Home.
- Deployed and rollback-tested: demo_generate_pickup_otp, demo_verify_pickup_otp_v2, demo_expire_marketplace and demo_recalculate_trust. Auction and Fixed Price acceptance check clock_timestamp() after row locks; active/partially_sold listings expire with unaccepted request remainder. The old demo_confirm_pickup RPC is denied to all API roles and its owner-call stub raises PICKUP_OTP_REQUIRED. See PHASE_2_0_17.md for security and validation limits.
