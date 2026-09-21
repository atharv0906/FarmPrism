# Phase 2.0.10 — Cross-role stabilization

The current local Development tree was used directly. No branch, commit, push, schema, migration, RLS, or database function changes were made.

## Diagnosed root cause

All three live /api/workspace responses initially returned 200. The exact "Invalid server response" message originated in the Node mutation service, not the workspace client. Read-only inspection of the deployed demo_set_batch_quality definition confirmed its response is batchId, qualityGrade, qualitySource. Node incorrectly required grade, notes, status, so a successful quality save could be reported as a failure and prevent Price Insight / selling-method navigation.

The adapter now recognizes that deployed response and reads the owned batch's persisted grade, notes, and status. No money, quantity, trust, or state defaults were invented. Other inspected listing/bid/request/job RPC responses match their adapters. Atomic transaction logic is unchanged.

## Implementation

- Runtime workspace validation checks every collection and nested financial, quantity, date, profile, and nullable field. The mobile client rejects incomplete payloads before replacing valid data.
- Saved Buyer delivery coordinates are scoped to the authenticated Buyer through a dedicated workspace property, never public profiles. Existing business names are used where present.
- Cached workspace data remains usable during refresh failures; a compact retry notice replaces the blocking card. Initial-load failures remain visible. Mutation messages are separate. Remote market data survives focus refreshes; account changes cannot display another session's cached workspace.
- Farmer selling-method cards use one full-card Pressable. A/B/C and 6/12/24 are accessible radio chips. Auction defaults to 24 hours; fixed-price expiry is explicit.
- RoleUI provides a branded shell and controls for Buyer, Logistics, and shared screens using existing assets. Existing TradingUI styles and approved Farmer Home/My Farm were not changed.
- Buyer overview metrics, market categories/cards, saved delivery, bid-status groups, orders, profile, and notifications use that shell. Fixed prices remain locked.
- Logistics controls follow job state. Simulated location controls are collapsed and labelled development only. OTP input accepts six digits and delivery confirmation remains the single existing verification step.
- Public profile cards use nullable trust/reliability values honestly. Tracking summaries do not print precise GPS. Seed notification codes resolve to visible canonical IDs.
- Farmer market views show current price/range in INR/quintal and one subtle source label. Price Insight retains suggested price and next-seven-day range without raw history or confidence. Server analytics and official-data normalization remain intact.

## Live verification boundaries

Farmer1, Buyer1, and Logistics1 sessions were created through the local API; tokens stayed in process memory and were revoked after checks. Each live workspace passed the mobile runtime validator. Tomato current-market returned finite INR/KG values from the existing demo data.

Android inspection covered Farmer Sell, Select Batch, Quality and chip selection, Insights, Profile, Buyer Home, Market, My Bids, Orders, and Profile. A real background refresh failure showed the compact notice while retaining Buyer content.

Full mutation smoke testing is incomplete. Automatic approval review rejected a same-value quality save because the existing RPC updates live data and can expire listings; no alternative mutation path was used. New emulator logins subsequently failed to resolve the Supabase hostname, preventing the remaining Logistics walkthrough. The current Buyer marketplace also has no open listings; a complete bid/request test requires creating a small demo scenario after approval.

## Validation

Commands: npm run typecheck; npm run test:mobile; npm --prefix server run typecheck; npm --prefix server run build; npm --prefix server test; npx expo export --platform android --output-dir .expo/phase-2-0-10-export; git diff --check.

Mobile tests include selling-method route payloads, publish validation/default duration, loading/error presentation, workspace contracts, and Logistics state controls. Server tests include the deployed quality response, persisted read behavior, all-role repository output against the mobile validator, RPC routes/authorization, and market normalization/fallback.

Repeat the live read check with: node server/node_modules/tsx/dist/cli.mjs server/scripts/workspace-smoke.ts

No government API key is configured. An empty DATA_GOV_IN_API_KEY line was removed from the ignored root .env; server/.env.example retains its blank placeholder. No secrets were printed or added to the mobile app.

Paste the data.gov.in key into server/.env as DATA_GOV_IN_API_KEY=... and restart npm run dev.

## Requested final checklist

Pass qualifiers distinguish live checks from isolated tests. A blocked full walkthrough is not claimed as a live pass.

| Area | Check | Result |
| --- | --- | --- |
| Runtime contract | Farmer /api/workspace | pass (live) |
|  | Buyer /api/workspace | pass (live) |
|  | Logistics /api/workspace | pass (live) |
|  | Root cause fixed | yes — deployed quality RPC response adapter corrected; regression tested |
|  | Blocking Retry card with valid cached data | removed |
|  | Background refresh failure UX | implemented; observed on Android |
| Farmer | Farmer Sell visual consistency | fail — full device walkthrough incomplete; implementation applied |
|  | Farmer Quality visual | pass (Android) |
|  | Grade A/B/C selection | pass (Android) |
|  | Auction selling method selectable | pass (isolated component test; live navigation blocked) |
|  | Fixed Price selling method selectable | pass (isolated component test; live navigation blocked) |
|  | Auction 6/12/24 selection | pass (component checks; 24-hour default) |
|  | Price Insight simplified | pass (implementation inspection) |
|  | Raw market history hidden | yes |
|  | Confidence hidden | yes |
|  | Farmer Home unchanged | yes |
|  | Farmer My Farm unchanged | yes |
| Buyer | Buyer Home restyled | yes |
|  | Buyer Market restyled | yes |
|  | Buyer bid flow | fail — live submission blocked |
|  | Buyer fixed-request flow | fail — live submission blocked |
|  | Buyer My Bids | pass (Android view) |
|  | Buyer Orders | pass (Android list; payment writes not run) |
|  | Buyer Profile | pass (Android) |
| Logistics | Logistics Home restyled | yes |
|  | Jobs restyled | yes |
|  | Job state actions | pass (isolated component tests) |
|  | Tracking UI | pass (isolated component tests; device walkthrough blocked) |
|  | Delivery OTP UI | pass (isolated component tests; live verification blocked) |
|  | History/Profile | fail — device walkthrough blocked |
| Market | DATA_GOV_IN_API_KEY configured | no |
|  | Government market fetch | not-run |
|  | Fallback remains available internally | yes |
|  | Word fallback shown repeatedly to Farmer | no |
| Quality/security | Service role key exposed to mobile | no |
|  | Data.gov.in key exposed to mobile | no |
|  | Fake runtime business data added | no |
|  | Business transaction logic changed | no — response mapping and display guards only; atomic RPC logic unchanged |
|  | Supabase schema changed | no |
| Validation | Root typecheck | pass |
|  | Mobile tests | pass — 16/16 |
|  | Android export | pass |
|  | Server typecheck | pass |
|  | Server build | pass |
|  | Server tests | pass — 81/81 |
|  | git diff --check | pass |

## Files changed

- DEVELOPMENT_GUIDE.md
- PROJECT_REQUIREMENTS.md
- README.md
- server/src/repositories/mutation.repository.ts
- server/src/repositories/trading.repository.test.ts
- server/src/repositories/trading.repository.ts
- server/src/services/mutation.service.ts
- server/src/types/trading.ts
- src/components/farmer-sell/FarmerSellUI.tsx
- src/hooks/useRemote.ts
- src/hooks/useTrading.ts
- src/navigation/TradingNavigator.tsx
- src/screens/trading/BuyerLogisticsScreens.tsx
- src/screens/trading/FarmerSellScreens.tsx
- src/screens/trading/MarketScreens.tsx
- src/screens/trading/SharedScreens.tsx
- src/services/api/trading.client.ts
- src/services/api/trading.types.ts
- src/services/api/trading.validation.ts
- tests/mobile-integration.test.ts
- PHASE_2_0_10.md
- server/scripts/workspace-smoke.ts
- server/src/services/quality.contract.test.ts
- src/components/farmprism-shell/LoadState.tsx
- src/components/farmprism-shell/RoleUI.tsx
- src/services/api/workspace.contract.ts
- tests/trading-ui.test.ts
- tests/workspace-contract.test.ts
- .env (ignored local file: removed empty server-only key placeholder)

## Known remaining blockers

- Automatic approval review requires human approval for the live business mutations, including the same-value quality save. That existing RPC also expires listings.
- Emulator login failed to resolve the Supabase hostname; local Node requests still succeeded.
- No current open Buyer listings; live bid/request smoke testing needs a small approved demo scenario.
- No data.gov.in key; official fetch intentionally not run.
