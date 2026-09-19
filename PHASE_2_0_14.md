# Phase 2.0.14 — Tester fixes and functional My Farm restoration

## Baseline and Git integration

- Starting tree: clean, Development at `ec141211bdf2ce9c3e21ef2632e15135c2398c6a` (also local origin/Development), the exact requested tester commit.
- Latest requested state was already present; no pull or merge was necessary. No remote freshness claim beyond that exact requested baseline.
- Inspected `0a74904a05312ed8d18f45b1fa90e58d9584123a` and its parent `39a771d`. Selected My Farm production/test patches only; no wholesale cherry-pick, reset, revert, checkout, stash, branch, commit or push.
- Historical cleanup CLI and tests were not restored or run.

## Tester fixes preserved

| Fix | Result |
| --- | --- |
| AuthProvider sessionStorage integration | Yes; production file unchanged, wiring regression tested |
| Web AsyncStorage / native SecureStore | Yes; production file unchanged, all three platforms mocked |
| ProtectedRoute Splash fallback | Yes; production file unchanged, role/auth matrix tested |
| FarmerDashboardView rendering changes | Yes; file unchanged |
| Demo session store changes | Yes; file unchanged |
| historyMany repository/service/summary optimization | Yes; repository/service unchanged, summary batching retained and tested |
| Development CORS | Yes; four tester origins unchanged, PATCH added for Edit Farm; preflight tested |
| Package manifests, lockfile, environment templates | Yes; unchanged |

Summary route now passes the existing historyMany repository method to the market service, alongside history. This completes batching through the route; the optional cache writer remains excluded.

## My Farm

Pass here means implementation/diff review and mocked automated verification, not live device or database verification.

| Screen | Result |
| --- | --- |
| Farm Overview | Pass |
| Edit Farm | Pass |
| My Crops | Pass |
| Add Crop | Pass |
| Available Produce | Pass |
| Crop Details | Pass |
| Crop Batches | Pass |
| Add Produce | Pass |
| Batch Details | Pass |
| Farm Activities | Pass |
| Farm Location | Pass |

All routes are registered in FarmerNavigator. Main-screen intents use typed navigation with crop/batch keys. Form submissions refresh data; server conflicts are displayed. Saved coordinates open Maps; absent coordinates do not fabricate a location. Batch timestamps generate creation/update activity; no fabricated farm-edit events.

- My Farm Coming Soon remaining: **No**.
- Main My Farm visual redesigned: **No**; layout/styles/assets retained, handlers wired and map placeholder text replaced.
- Farmer Home visual redesigned: **No**; tester Home file unchanged.

## Inventory model and Sell

- New crop table: **No**.
- Add Crop creates first current batch: **Yes**.
- Add Produce creates separate batch: **Yes**.
- Zero-KG current crop appears: **No**.
- Available-to-sell uses only positive available batches: **Yes**.
- Active Batches uses positive non-terminal inventory: **Yes**, excluding sold/completed/cancelled.
- New grade: **null**; new notes: **null**; source: **farmer_declared**; status: **available**.
- My Farm batches integrate with existing Sell: **Yes**.
- Optional crop filter: **Pass**, including unfiltered selection and existing listing exclusions.
- Batch Details canonical Quality route: **Pass**; active listings open existing listing details.
- Quality remains Sell-only: **Yes**.
- Marketplace rules changed: **No**.

Writes are authenticated Node endpoints: POST /api/farmer/crops, POST /api/farmer/batches and PATCH /api/farmer/farm. Identity comes from the session. Input rejects client identity, unsupported crops/fields, invalid quantities and invalid coordinate pairs. Existing inventory/profile tables are used. Clients retain strict parsing and existing 401 cleanup.

## Database and OTP boundaries

| Action | Performed |
| --- | --- |
| Schema/migration changes | No |
| RLS/grant changes | No |
| Existing RPC changes | No |
| Global cleanup/reset/seed | No |
| Live database writes or live sessions | No |
| Real SMS | No |

Any-six-digit prototype OTP: unchanged and verified with mocked dependencies. Private environment files were neither changed nor printed. No live DB count verification was performed; existing state was preserved by making no live calls.

## Runtime stub search

Scoped to My Farm runtime screens, hooks and data module:

- Alert.alert('Coming Soon', ...): **0**.
- myFarmIntentMessage: **0**.
- Map preview coming soon: **0**.
- myFarmPrototype: **0**.
- myFarmEmptyStates: **0**.

## Measured validation

| Command | Result |
| --- | --- |
| npm run typecheck | Pass |
| npm run test (invokes npm run test:mobile) | Pass: 48 tests |
| npm --prefix server run typecheck | Pass |
| npm --prefix server run build | Pass |
| npm --prefix server test | Pass: 110 tests |
| npx expo export --platform android --output-dir .expo/phase-2-0-14-export | Pass: 1,044 modules, 107 assets |
| git diff --check | Pass |

Initial test attempts failed before execution with sandbox `uv_os_get_passwd ENOMEM`; mocked suites ran successfully outside that sandbox. Two new mobile tests initially had an incorrect ES module mock wrapper; corrected the test mocks, then all 48 passed. No production session changes were needed. Server tests use mocked/injected data and localhost test listeners; no live Supabase reset or data.gov.in.

Reviewed diff/stat and focused diffs for FarmerMyFarmScreen, FarmerNavigator, app and farmerSummary.service. Tester-owned files outside the intentional app/summary integration have no Git content diff. Android export is a bundle check, not device/UI verification. Full live Auction/Fixed E2E was not repeated.

## Remaining limitations

No implementation/check blockers in this scoped restoration. Device interaction, native location permissions, browser Maps launch and live end-to-end writes remain unverified in this phase. The restored per-account/crop duplicate guard supports a single Node process; multi-replica deployment requires database transaction/locking work outside this phase. Existing external grant revocation handoff remains unchanged.

## Files changed

- `DEVELOPMENT_GUIDE.md`
- `PHASE_2_0_14.md`
- `PROJECT_REQUIREMENTS.md`
- `server/src/app.cors.test.ts`
- `server/src/app.ts`
- `server/src/repositories/farmerInventory.repository.ts`
- `server/src/repositories/farmerSummary.repository.test.ts`
- `server/src/repositories/farmerSummary.repository.ts`
- `server/src/routes/demo.otp.test.ts`
- `server/src/routes/farmerInventory.routes.test.ts`
- `server/src/routes/farmerInventory.routes.ts`
- `server/src/routes/farmerSummary.routes.test.ts`
- `server/src/routes/farmerSummary.routes.ts`
- `server/src/services/farmerInventory.service.test.ts`
- `server/src/services/farmerInventory.service.ts`
- `server/src/services/farmerSummary.service.test.ts`
- `server/src/services/farmerSummary.service.ts`
- `server/src/utils/farmerInventory.ts`
- `server/src/utils/parseFarmBatch.ts`
- `src/components/farmer-my-farm/myFarmData.ts`
- `src/hooks/useMyFarmAction.ts`
- `src/navigation/FarmerNavigator.tsx`
- `src/navigation/TradingRoutes.ts`
- `src/screens/FarmerFarmScreens.tsx`
- `src/screens/FarmerMyFarmScreen.tsx`
- `src/screens/trading/FarmerSellScreens.tsx`
- `src/services/api/api.client.ts`
- `src/services/api/farmerInventory.client.ts`
- `src/services/api/farmerInventory.validation.ts`
- `src/services/api/farmerSummary.contract.ts`
- `src/services/api/farmerSummary.types.ts`
- `src/services/demo/demo.types.ts`
- `tests/farmer-farm-ui.test.ts`
- `tests/farmer-home.test.cjs`
- `tests/farmer-inventory.test.ts`
- `tests/farmer-navigation.test.ts`
- `tests/farmer-session.test.ts`
- `tests/trading-ui.test.ts`
