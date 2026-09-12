# Phase 2.0.12 — Authoritative Farmer Data + Onboarding Consistency

Completed locally on 2026-09-12. Baseline: d5290df0b9ac008c98c80ad698e4699a3fcdc83c. Initial git status was clean; no pre-existing local edits. No reset, revert, checkout, stash, branch, commit or push occurred. No schema, migrations, RLS, grants, RPC definitions, secrets or transaction business logic changed.

## Farmer Home

| Requirement | Result |
|---|---|
| GET /api/farmer/home-summary, authenticated Farmer-only | YES |
| Direct mobile snapshot RPC removed | YES |
| Current physical inventory, profile, notifications and selling activity | YES |
| Auction-only highest eligible Top Opportunity | YES |
| Existing current market service | YES |
| Visual changes | NO |

The repository filters identity by authenticated account ID, never client query/body identity. Auction/bid reads follow owned batch/auction IDs. No legacy snapshot or expiry RPC is called by the new summaries. Results fail safely at the 1000-row cap instead of silently truncating.

Inventory eligibility is status available with positive remaining_quantity_kg. Listed quantities are not subtracted again from physical inventory. Supported represented crops determine cropCount, including a represented crop with no eligible remaining quantity. KG is divided by 100 for Quintals.

Active auctions are open/partially_sold, started and unexpired, with positive remaining quantity and eligible physical inventory. Eligible active/partially_accepted bids must have unallocated quantity after non-cancelled order allocations. Highest price wins the displayed opportunity, with deterministic ID tie-break; this is a display selection, not automatic acceptance. Buyer count is distinct eligible buyers in that auction. No eligible bid returns null, and fixed requests are never queried for this opportunity.

New Offer counts unread new_bid and bid_revised notifications; unread badge counts all unread notifications. Sold This Month sums completed order totals using completed_at in the current Asia/Kolkata calendar month, excluding future timestamps.

Market cards use latest valid modal observations from existing market.history for all three crops, converted to INR/Quintal. Trend compares an earlier dated observation from the same market/state/district; insufficient comparable history gives 0%. The existing service keeps official AGMARKNET and DB fallback behavior. Summary injection omits optional persistent cache writes, so summary reads do not write non-demo market rows. If a crop has no usable history, its card is omitted rather than fabricating a price. DTO and frozen visuals have no new provenance field; existing price-insight source labels remain unchanged.

## My Farm

| Requirement | Result |
|---|---|
| GET /api/farmer/my-farm-summary, authenticated Farmer-only | YES |
| Direct mobile snapshot RPC removed | YES |
| Current remaining KG, crop grouping and eligible batch counts | YES |
| Clean zero/empty state without manufactured crops | YES |
| Visual changes | NO |

Profile location and area are persisted values. No farm-name field exists, so name is null. Farm ID identifies the account; crop grouping IDs are stable crop slugs, not invented database entities. Each represented crop groups eligible physical batches; inactive groups have zero KG/count. Activities count represented crops and distinct batches created or updated during the current India calendar month, not the number of edit events. Unsupported My Farm write modules remain unavailable.

## Mobile auth, roles and onboarding

| Requirement | Result |
|---|---|
| get_demo_account_by_phone removed from mobile runtime | YES |
| Fresh identity from POST /api/demo/session | YES |
| Restore identity from authenticated GET /api/demo/me | YES |
| Revoked/invalid restore rejected and session cleared | YES |
| Fresh account opens Role Selection | YES |
| Unassigned role blocked; FPO Coming Soon only | YES |
| Remembered assigned role skips selection | YES |
| Fresh/incomplete Farmer enters Personal flow | YES |
| Local per-account completion marker written only on Submit | YES |
| Logout preserves role/onboarding preferences | YES |
| Returning completed Farmer opens Dashboard | YES |

Strict Node summary clients retain existing bearer-token handling, focus refresh, cached-data UX and unauthorized cleanup. Cached summaries are isolated by session token. Missing nullable fields, invalid nested values, unsupported crops/units and nonfinite or negative quantities are rejected. Session restore validates the server response rather than trusting cached phone identity. Network/503 failures do not erase stored credentials as if revoked.

Existing SecureStore session keys remain in use. The local farmprism.mock.farmerOnboarding.v1:<phone> marker stores only complete; it contains no secret and writes no server profile. Explicit role confirmation alone does not complete onboarding. Review Submit persists completion before navigating to Submitted. Normal logout removes only session credentials/cached phone, retaining local role and completion preferences. Existing language preference takes returning/expired sessions to Login. Buyer/Logistics keep preseeded profiles and dashboard routing; no new onboarding forms were added.

The 11-digit Farmer ID validation, optional Farm Size, three supported crops, Camera/Gallery custom preview with Cancel/Done, submitted wording and Go to Dashboard remain unchanged. Home/My Farm views and both mappers were compared with HEAD and are unchanged. FarmerScreens.tsx changes are imports and the Review submission handler only. UI behavior is covered by mocked service/navigation tests and Android compilation; this phase does not claim an on-device walkthrough or screenshot verification.

## Legacy grant handoff

A fresh search of src found zero references to each function below. The unused mobile demo service/parser were removed; notifications retain Node workspace + POST read behavior.

| Function signature | Mobile runtime reference | Ready for external anon/authenticated EXECUTE revocation |
|---|---|---|
| public.get_demo_account_by_phone(text) | NO | YES |
| public.get_demo_farmer_home_summary(text) | NO | YES |
| public.get_demo_farmer_my_farm_summary(text) | NO | YES |
| public.get_demo_notifications(text) | NO | YES |
| public.mark_demo_notification_read(text, uuid) | NO | YES |

Database owner must retain service_role. The server integration route still calls mark_demo_notification_read under its existing service-role boundary. No grants were changed here. This handoff covers the current mobile runtime; previously installed old app builds must be replaced before relying on removal of their old path.

## Live targeted validation

Newly built local Node API, existing Farmer1 account, current Supabase demo data. Session token stayed in memory and was revoked. No full marketplace E2E or reset was run. Workspace retains its existing demo marketplace expiry behavior; new summary routes themselves are reads only.

| Step | Result | Evidence |
|---|---|---|
| session | PASS | {"http":200} |
| /api/demo/me | PASS | {"http":200} |
| server identity | PASS | {} |
| /api/workspace | PASS | {"http":200} |
| /api/farmer/home-summary | PASS | {"http":200} |
| /api/farmer/my-farm-summary | PASS | {"http":200} |
| authoritative inventory read | PASS | {} |
| Home KG matches DB/workspace | PASS | {"kg":680,"quintals":6.8} |
| My Farm KG and batch count match DB/workspace | PASS | {"kg":680,"batches":3} |
| crop Tomato | PASS | {"kg":90,"batches":1} |
| crop Onion | PASS | {"kg":350,"batches":1} |
| crop Potato | PASS | {"kg":240,"batches":1} |
| profile matches workspace | PASS | {} |
| market Tomato | PASS | {"pricePerQuintal":850,"source":"data.gov.in / AGMARKNET","isDemo":false,"observedAt":"2026-09-12T00:00:00.000Z","trendPercent":0} |
| market Onion | PASS | {"pricePerQuintal":3750,"source":"data.gov.in / AGMARKNET","isDemo":false,"observedAt":"2026-09-12T00:00:00.000Z","trendPercent":0} |
| market Potato | PASS | {"pricePerQuintal":1100,"source":"data.gov.in / AGMARKNET","isDemo":false,"observedAt":"2026-09-12T00:00:00.000Z","trendPercent":0} |
| previous E2E orders remain completed | PASS | {"orders":[{"order_code":"FP-11332B8B3E","status":"completed"},{"order_code":"FP-25A03D7831","status":"completed"}]} |
| /api/demo/logout | PASS | {"http":200} |
| revoked token rejected | PASS | {"http":401,"api":"/api/farmer/home-summary","code":"invalid_session"} |

The observed 680 KG is test-time evidence, not an expected constant in application code or live reconciliation. All three current market observations were official AGMARKNET, dated 2026-09-12; neutral trends reflected insufficient earlier same-market observations. Prior orders FP-11332B8B3E and FP-25A03D7831 remain completed. Safe raw results are in ignored .expo/phase-2-0-12/live-results.json.

## Validation

| Check | Result |
|---|---|
| npm run typecheck | PASS |
| npm run test | PASS — 30 tests |
| npm --prefix server run typecheck | PASS |
| npm --prefix server run build | PASS |
| npm --prefix server test | PASS — 99 tests |
| Android export to .expo/phase-2-0-12-export | PASS — 1039 modules, 107 assets |
| git diff --check | PASS |

Unit tests use mocked repositories, storage, HTTP and navigation dependencies, never live Supabase. Coverage includes aggregation, month boundaries, missing inventory, opportunity eligibility, market history, actor scoping, 401/403, strict DTOs, authoritative login/restore, revocation, role confirmation, onboarding isolation and returning navigation. Windows sandbox tsx failed before running tests with uv_os_get_passwd ENOMEM; the authorized runs outside that sandbox passed. A Node test initially loaded React Native directly; its transport dependency was correctly mocked, then the full suite passed.

Marketplace business logic changed: NO. Auction/fixed acceptance, allocations, bid changes, payments, logistics, fee split, tracking, OTP, final balances, feedback, trust, reset, market environment contract and ±3% price policy remain unchanged.

## Files changed

M = modified; D = deleted; ?? = new. PHASE_2_0_12.md is also new.

- M AGENTS.md
- M DEVELOPMENT_GUIDE.md
- M PROJECT_REQUIREMENTS.md
- M README.md
- M package.json
- M server/src/app.ts
- M src/app/providers/AuthProvider.tsx
- M src/app/providers/LanguageProvider.tsx
- M src/app/providers/RoleProvider.tsx
- M src/hooks/useFarmerHome.ts
- M src/hooks/useFarmerMyFarm.ts
- M src/hooks/useLanguage.ts
- M src/lib/supabase/types.ts
- M src/navigation/AuthNavigator.tsx
- M src/navigation/FarmerNavigator.tsx
- M src/screens/FarmerScreens.tsx
- D src/services/demo/demo.parsers.ts
- D src/services/demo/demo.service.ts
- M src/services/demo/demo.types.ts
- M tests/farmer-home.test.cjs
- ?? server/src/repositories/farmerSummary.repository.test.ts
- ?? server/src/repositories/farmerSummary.repository.ts
- ?? server/src/routes/farmerSummary.routes.test.ts
- ?? server/src/routes/farmerSummary.routes.ts
- ?? server/src/services/farmerSummary.service.test.ts
- ?? server/src/services/farmerSummary.service.ts
- ?? src/services/api/demoSession.client.ts
- ?? src/services/api/farmerSummary.client.ts
- ?? src/services/api/farmerSummary.contract.ts
- ?? src/services/auth/demoSession.service.ts
- ?? src/services/roles/mockFlow.service.ts
- ?? tests/farmer-navigation.test.ts
- ?? tests/farmer-session.test.ts

## Remaining blockers

No implementation or validation blockers. External legacy grant revocation remains the database owner's follow-up; no database permissions were altered. No commit or push.
