# Phase 2.0.13 — Fully Functional My Farm + Clean Prototype State

Completed locally on 2026-09-15. Current Development baseline: `39a771dc6cc6c031dad9ce73eef7a5d9ef451221` (`Fixess`). Pre-existing package.json and package-lock.json edits were preserved without additional edits to either file. No branch, commit, push, checkout, stash, reset, revert or history rewrite was performed.

## Implementation

All eleven My Farm secondary screens are implemented: Farm Overview, Edit Farm, My Crops, Add Crop, Available Produce, Add Produce, Crop Details, Physical Batches, Batch Details, Farm Activities and Farm Location. Main My Farm intents navigate through a typed action hook; no Coming Soon stub remains for these actions. Farmer Home is unchanged. Main My Farm layout, styles and assets are unchanged; its map placeholder text now says “Open saved farm location.” No supplied screenshot was used as a design reference. Existing cream/green Farmer components are reused.

The authenticated Node endpoints POST /api/farmer/crops, POST /api/farmer/batches and PATCH /api/farmer/farm require a persisted demo session and Farmer role. Identity comes exclusively from the session. Unknown fields, client account IDs, unsupported crops and nonfinite/out-of-bound quantities are rejected. Quantity is 0.01–1,000,000 KG, at most two decimals. Area supports 0–100,000 acres, labels are trimmed and limited to 200 characters, and coordinate pairs require valid geographic ranges. Text-only edits preserve saved coordinates. No farm-name field or profile identity fields were added.

Add Crop creates the first positive physical batch and returns CROP_ALREADY_EXISTS for an already-current crop. Add Produce requires a current crop, returns CROP_NOT_ACTIVE otherwise, and creates another physical batch without merging. Batch codes are server-generated UUID-derived FPB identifiers with bounded uniqueness retries. New batches persist quality_grade=null, quality_source=farmer_declared, quality_notes=null and status=available, with equal original/remaining quantities.

Current batches require remaining KG >0 and status outside sold/completed/cancelled. Current crops are distinct crops represented by those batches. Crop count and active batch count use current physical batches; available KG uses only available batches. Positive reserved inventory therefore preserves a crop and counts as a batch while contributing no available KG. Zero/terminal-only crops disappear. The rules are centralized on the server and covered by tests.

The strict My Farm contract now includes saved coordinates, physical batch details and timestamp-derived activity. Existing visual mappings retain crop artwork and display format. Crop Details links to the existing market endpoint and Insights MarketDetails. Sell SelectBatch accepts an optional crop filter and still works unfiltered. Batch Details uses canonical Quality or the existing current listing screen. Marketplace mutations, price policy, OTP, payments, logistics and existing RPC definitions remain unchanged.

Farm Location uses React Native Linking with persisted coordinates. Missing coordinates disable Open in Maps and explain how to add them. Optional Use Current Location uses existing expo-location. No map package was added. Farmer quality remains Sell-only.

Production myFarmPrototype, myFarmEmptyStates, prototype IDs, fixture quantities and myFarmIntentMessage were removed. The remaining Wagholi string in Farmer onboarding is a legitimate village choice. The legacy order-detail response now resolves its crop from the physical batch and fails safely for missing crop data; missing legacy timestamps remain null instead of being fabricated as now. No new runtime transaction fixtures or trust scores exist.

## OTP

- Prototype mock OTP unchanged: yes.
- Any six numeric digits accepted for fixed demo accounts: yes, tested with several arbitrary values.
- Non-six-digit and unknown-account rejection: pass.
- Real SMS added: no.
- Supabase Auth dependency added: no.
- Existing SecureStore/provider lifecycle and logout/revocation: preserved.

## Targeted live verification

The compiled local Node app ran on an ephemeral loopback port against the existing Supabase project. Tokens and private coordinates stayed in process memory. Farmer2 was verified empty before writes. No additional auction/fixed E2E was performed.

| Check | Result |
|---|---|
| Farmer2 session and /api/demo/me | PASS |
| Initial empty My Farm summary | PASS |
| Add Crop Tomato 100 KG | PASS — 201 |
| Summary 100 KG / one batch | PASS |
| Duplicate Add Crop | PASS — 409 CROP_ALREADY_EXISTS |
| Add Produce Tomato 50 KG | PASS — 201, separate batch |
| Summary 150 KG / two batches | PASS |
| Real batch details and persisted defaults | PASS |
| Sell workspace sees both created batches | PASS |
| Existing batch-quality mutation | PASS — Grade B |
| Existing Price Insight | PASS — official market source and positive recommendation |
| Farm area edit and omitted coordinates preserved | PASS |
| Explicit saved coordinates/location round-trip | PASS |
| Original profile fields restored | PASS |
| Logout | PASS — 200 |
| Revoked token | PASS — 401 |

Maps URL construction and missing-coordinate behavior passed mocked tests. This is API and mocked component verification plus Android compilation, not an on-device walkthrough. Device GPS permission handling and opening the native Maps app were not manually exercised.

The first live script invocation had an incorrect local import path and was corrected before any network work. The network-restricted sandbox then could not read Farmer2. Automated approval initially rejected unsandboxed live writes as unauthorized test data. Re-reading the user's explicit Stage C and Stage D instructions established authorization; the reviewed retry was approved and passed. No unresolved approval block remains.

Safe live output: ignored `.expo/phase-2-0-13/live-results.json`.

## Final cleanup

Executed only after automated checks, Android export and live verification passed:

```powershell
npm --prefix server run clear:demo-activity -- CLEAR_FARMPRISM_ACTIVITY
```

The development-only CLI uses a fixed whitelist and FK-safe order verified from deployed metadata. It rejects production and incorrect/extra confirmation arguments, never calls the old reseeding reset RPC, preserves identities/profiles/config and official market rows, and verifies before/after counts. The local live-test server was closed before cleanup. An independent read-only SQL query confirmed every result below. No session was created after cleanup.

| Target | Before | After |
|---|---:|---:|
| demo_inventory_batches | 8 | 0 |
| demo_auctions | 4 | 0 |
| demo_bids | 7 | 0 |
| demo_fixed_price_listings | 3 | 0 |
| demo_purchase_requests | 3 | 0 |
| demo_orders | 7 | 0 |
| demo_order_events | 42 | 0 |
| demo_payments | 17 | 0 |
| demo_logistics_jobs | 5 | 0 |
| demo_tracking_points | 8 | 0 |
| demo_delivery_otps | 4 | 0 |
| demo_feedback | 18 | 0 |
| demo_disputes | 0 | 0 |
| demo_notifications | 64 | 0 |
| demo_trust_scores | 9 | 0 |
| demo_price_recommendations | 0 | 0 |
| demo_farmer_home_snapshots | 3 | 0 |
| demo_farmer_my_farm_snapshots | 3 | 0 |
| demo_sessions | 25 | 0 |
| mandi_prices is_demo=true | 273 | 0 |
| demo_accounts | 9 | 9 |
| demo_farmer_profiles | 3 | 3 |
| demo_buyer_profiles | 3 | 3 |
| demo_logistics_profiles | 3 | 3 |
| mandi_prices is_demo=false | 94 | 94 |

No seeded transactions or inventory remain. Profile/location identity and all 94 official Government observations remain. New user sessions will see empty transaction lists and nullable Trust / Not available. Farmer Home and My Farm totals derive zero activity; existing frozen visuals may use an em dash with “No sales yet” instead of a fabricated monetary value. Sell empty state now links to My Farm.

## Validation

| Check | Result |
|---|---|
| npm run typecheck | PASS |
| npm run test:mobile / npm run test | PASS — final 44 tests |
| npm --prefix server run typecheck | PASS |
| npm --prefix server run build | PASS |
| npm --prefix server test | PASS — 111 tests |
| Android export, .expo/phase-2-0-13-export | PASS — 1043 modules, 107 assets |
| git diff --check | PASS |
| My Farm intent navigation and mutation refresh | PASS — mocked component/action tests |
| Farmer empty summary, batches and Sell path | PASS |
| Buyer market/bids/orders empty states | PASS — mocked components/contracts |
| Logistics jobs/history empty states | PASS — mocked components/contracts |
| Nullable Trust across all three roles | PASS |
| Cleanup production and confirmation guards | PASS — mocked tests |

Windows sandbox tsx initially failed before tests started with uv_os_get_passwd ENOMEM. Approved runs outside that sandbox passed. Automated tests use injected/mocked dependencies; no live reset, market fetch or cleanup is executed by tests. The final added empty-state component test ran after cleanup using mocks only.

## Boundaries and limitations

- Database schema, migrations, RLS, grants and existing marketplace RPC definitions changed: NO.
- Marketplace transaction logic changed: NO.
- New crop table, embedded map package, real SMS, real payments, blockchain or AI certification: NO.
- Farm Updated history is omitted: no clean persisted edit-event model exists without schema changes. Batch creation/update history uses real timestamps, not a full edit log.
- Concurrent Add Crop requests serialize within one Node process. Running multiple API replicas requires a database lock/transaction before deployment; the current local prototype uses one process.
- Cleanup is a sequence of Data API deletions, not one cross-table transaction. It stops on failure; run with the API stopped and resolve any error before a guarded rerun.
- No device/screenshots/GPS/Maps-app walkthrough is claimed. Automated component checks and Android export passed.
- Five retired mobile RPC grants remain the previously documented external owner follow-up; no grants were modified.

Remaining implementation or cleanup blockers: none. No commit or push.

## Files changed

Pre-existing only: package.json and package-lock.json.

Documentation: README.md, PROJECT_REQUIREMENTS.md, DEVELOPMENT_GUIDE.md, AGENTS.md, PHASE_2_0_13.md.

Server:

- server/package.json
- server/scripts/clearDemoActivity.ts
- server/src/app.ts
- server/src/repositories/farmerSummary.repository.ts
- server/src/repositories/farmerSummary.repository.test.ts
- server/src/repositories/farmerInventory.repository.ts
- server/src/repositories/clearDemoActivity.repository.ts
- server/src/routes/demo.routes.ts
- server/src/routes/demo.otp.test.ts
- server/src/routes/farmerSummary.routes.test.ts
- server/src/routes/farmerInventory.routes.ts
- server/src/routes/farmerInventory.routes.test.ts
- server/src/services/farmerSummary.service.ts
- server/src/services/farmerSummary.service.test.ts
- server/src/services/farmerInventory.service.ts
- server/src/services/farmerInventory.service.test.ts
- server/src/services/clearDemoActivity.service.ts
- server/src/services/clearDemoActivity.service.test.ts
- server/src/utils/farmerInventory.ts
- server/src/utils/parseFarmBatch.ts

Mobile:

- src/components/farmer-my-farm/myFarmData.ts
- src/hooks/useMyFarmAction.ts
- src/navigation/FarmerNavigator.tsx
- src/navigation/TradingRoutes.ts
- src/screens/FarmerMyFarmScreen.tsx
- src/screens/FarmerFarmScreens.tsx
- src/screens/trading/FarmerSellScreens.tsx
- src/services/api/api.client.ts
- src/services/api/farmerSummary.contract.ts
- src/services/api/farmerSummary.types.ts
- src/services/api/farmerInventory.client.ts
- src/services/api/farmerInventory.validation.ts
- src/services/demo/demo.types.ts

Tests:

- tests/farmer-home.test.cjs
- tests/farmer-session.test.ts
- tests/farmer-inventory.test.ts
- tests/farmer-farm-ui.test.ts
- tests/trading-ui.test.ts

Validation artifacts remain under ignored .expo paths. Root/server private environment files and pre-existing Expo/package changes were not modified.
