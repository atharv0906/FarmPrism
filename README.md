# FarmPrism

FarmPrism is an agricultural marketplace prototype with implemented Farmer, Buyer and Logistics workflows. React Native / Expo communicates with the Node/Express TypeScript business API and Supabase, the persisted source of truth and transactional RPC boundary.

Current phase: [2.0.12 — authoritative Farmer data and onboarding consistency](PHASE_2_0_12.md). The preceding live demo completed both Auction and Fixed Price through delivery OTP, final simulated payments, feedback, trust and inventory reconciliation: FP-11332B8B3E and FP-25A03D7831. Phase 2.0.11 fixes logout, makes government market configuration explicit, adds bounded contextual price adjustments and provides a guarded reset CLI.

## Implemented prototype

- Exactly three permanent roles: farmer, buyer, logistics. One login has one role; sign out to change accounts. FPO is Coming Soon only, not a persisted role or Buyer subtype.
- Nine fixed demo accounts, any six-digit numeric development OTP, server-issued demo sessions, SecureStore persistence and revoked-token rejection.
- Farmer Home, My Farm, Sell, Insights, Profile, Notifications and secondary selling/transaction screens. Approved Home/My Farm visuals remain frozen; Farmer Home has no Trust Score.
- Buyer Home, Market, My Bids/Requests, Orders, Profile and transaction screens; Logistics Home, Jobs, Active, History and Profile.
- Tomato, Onion and Potato only. KG internally; 100 KG = 1 Quintal.
- Auction (6/12/24 hours, default 24), partial quantities, bid revision/withdrawal and Farmer choice of eligible offer; no auto-highest winner. Fixed Price has a locked Farmer price, 24-hour expiry and quantity/advance requests.
- Farmer Declared A/B/C quality. Grade C is not untrustworthy; quality declaration consistency is separate from grade.
- Accepted Buyer/Farmer advance of 10–90%, simulated payments, atomic first-eligible logistics claim, fee agreement, 40%/60% logistics payments, ₹0 platform logistics fee.
- Pickup, real device GPS and labelled development simulation, delivery OTP verification as delivery confirmation, final balances, feedback, backend-controlled trust and notifications.

## Authoritative Farmer reads and onboarding

Home and My Farm now use authenticated Farmer-only Node summaries backed by current physical inventory, profiles, orders and notifications. The mobile snapshot RPC service is removed; approved visuals and mappers are unchanged. Unsupported My Farm write modules remain unavailable.

Mock login uses the account returned by POST /api/demo/session; saved sessions restore through GET /api/demo/me. First login requires explicit confirmation of the assigned role. Remembered roles skip selection. Farmer Submit saves a per-account local onboarding completion marker; returning completed Farmers enter Dashboard. Logout preserves role/onboarding preferences. These local UX markers do not write server profiles or store secrets.

Five legacy mobile RPC grants await external database-owner revocation for anon/authenticated, retaining service_role. See [Phase 2.0.12](PHASE_2_0_12.md) for signatures and validation.

## Market and price insight

The Node data.gov.in / AGMARKNET adapter normalizes INR/Quintal observations to INR/KG. Official provenance requires normalized official observations; DB/demo fallback remains labelled honestly. Missing market credentials do not block the server.

Market/statistical inputs dominate a deterministic recommendation. Farmer-declared grade, demand and lot size contribute at most ±3% combined; this is not a trained AI or a guaranteed selling price. Optional AI supplies explanation only and cannot override numeric prices.

Farmer sees Current / Min / Max / Suggested / Next 7 Days, primarily in ₹/Quintal, plus a subtle market source label. Raw history, confidence and statistical diagnostics remain internal.

## Local setup

Install root and server dependencies separately, then create private .env files from the tracked examples. Preserve existing local private values.

```powershell
npm install
npm --prefix server install
npm run dev
```

In another terminal:

```powershell
npm run dev:mobile
```

Health: GET http://localhost:3000/health. Android emulator API URL: http://10.0.2.2:3000. See [the development guide](DEVELOPMENT_GUIDE.md) for configuration and validation.

Mobile .env contains public Supabase values and EXPO_PUBLIC_API_URL only. The publishable key takes priority with legacy anon-key fallback. Service-role, MARKET_* and AI_PROVIDER_* credentials belong only in server/.env. Never log keys, raw tokens or OTPs.

## Deliberate demo reset

The development CLI calls only the existing service-role-only demo_reset_prototype_data RPC. It rejects production and requires exact confirmation:

```powershell
npm --prefix server run reset:demo -- RESET_FARMPRISM_DEMO
```

This clears demo sessions and transaction evidence and restores the RPC's defined scenario. Run only when intentionally discarding the current demo runtime state. It was not executed during Phase 2.0.11. No reset HTTP/mobile UI exists.

## Scope and documentation

Disputes have backend foundation only, without UI. Real SMS, production payments, FPO implementation, genuine camera/video AI quality, blockchain and production deployment/security hardening remain future work. Do not represent these as implemented or add fake chain hashes/quality certification.

- [Product requirements and demo account roster](PROJECT_REQUIREMENTS.md)
- [Development guide](DEVELOPMENT_GUIDE.md)
- [Agent rules](AGENTS.md)
- [Current designer screen brief](assets/FarmPrism_Designer_Screen_MDs/INDEX.md)
- [Designer master flow](assets/FarmPrism_Designer_Screen_MDs/MASTER_FLOW.md)
- [Phase 2.0.11 validation report](PHASE_2_0_11.md)

Preserve the current Development tree and approved visuals. Do not change schema, migrations, RLS or existing database functions in this phase. Do not commit or push.
