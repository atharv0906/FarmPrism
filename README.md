# FarmPrism

FarmPrism is an agricultural marketplace prototype with implemented Farmer, Buyer and Logistics workflows. React Native / Expo communicates with the Node/Express TypeScript business API and Supabase, the persisted source of truth and transactional RPC boundary.

Current phase: [2.0.13 — functional My Farm and clean prototype activity](PHASE_2_0_13.md). Earlier Auction and Fixed Price E2E results remain documented in the historical phase reports. This phase adds farm/inventory writes and secondary screens, preserves marketplace rules, and clears demo activity without reseeding.

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

Home and My Farm use authenticated Farmer-only Node summaries. A current crop requires positive physical inventory with a non-terminal status. Available quantity includes only available batches. Add Crop creates the first physical batch; Add Produce creates a separate batch for a current crop. New batches have null grade; Farmer Declared A/B/C remains in Sell. No crop table or farm-name field was added.

Farm Overview, Edit Farm, My Crops, Add Crop, Available Produce, Add Produce, Crop Details, Physical Batches, Batch Details, Farm Activities and Farm Location are implemented. Farm editing persists area/location and optional device coordinates. Open in Maps uses saved coordinates and React Native Linking; no embedded map package. Main Home/My Farm layouts and assets remain frozen, with the map placeholder copy updated for its working action.

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

For an empty activity state, stop the development API and run the guarded, fixed-whitelist cleanup:

```powershell
npm --prefix server run clear:demo-activity -- CLEAR_FARMPRISM_ACTIVITY
```

It preserves the nine identities and profiles, categories/configuration and official Government observations. It deletes activity, sessions, trust rows and demo-only market rows without reseeding. Production and incorrect confirmation are refused; before/after counts are verified. It is sequential, so failures may leave partial cleanup and must be resolved before a guarded rerun. The older reset CLI reseeds a scenario and must not be used for this clean-state workflow. No cleanup HTTP/mobile UI exists.

## Scope and documentation

Disputes have backend foundation only, without UI. Real SMS, production payments, FPO implementation, genuine camera/video AI quality, blockchain and production deployment/security hardening remain future work. Do not represent these as implemented or add fake chain hashes/quality certification.

- [Product requirements and demo account roster](PROJECT_REQUIREMENTS.md)
- [Development guide](DEVELOPMENT_GUIDE.md)
- [Agent rules](AGENTS.md)
- [Current designer screen brief](assets/FarmPrism_Designer_Screen_MDs/INDEX.md)
- [Designer master flow](assets/FarmPrism_Designer_Screen_MDs/MASTER_FLOW.md)
- [Phase 2.0.11 validation report](PHASE_2_0_11.md)

Preserve the current Development tree and approved visuals. Do not change schema, migrations, RLS or existing database functions in this phase. Do not commit or push.
