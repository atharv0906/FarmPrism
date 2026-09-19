# Phase 2.0.16 — Audit fixes and Farmer Pickup OTP integration

Date: 2026-09-19. Local application integration is complete and validated with mocks. External database deployment and subsequent live/device verification remain outstanding.

## Baseline

- HEAD: d49cb2894fa2b011afaeefeba13fb9e230bb927c
- Expected: d49cb2894fa2b011afaeefeba13fb9e230bb927c
- Baseline status, HEAD and six recent commits checked before edits.
- Unexpected pre-existing changes: none.
- Pre-existing audit files preserved: yes — PHASE_2_0_15_TEST_AUDIT.md, tests/phase-2-0-15.audit.test.ts, server/src/services/phase-2-0-15.audit.test.ts.
- Historical audit report and server audit test are unchanged. Mobile audit assertions remain intact; its loader now resolves the production listing-state helper, and the acceptance fixture supplies real listing status/end-time fields. No assertion was deleted/weakened/skipped and no .only was added.
- No branch/checkout/reset/revert/stash/commit/push operations.

## Phase 2.0.15 regression fixes

| Audit | Result | Evidence / behavior |
| --- | --- | --- |
| AUD-01 Market batching fallback | Pass | Failed stored batch read no longer discards successful official observations. Stored fallback, combined results and partial crop availability tested; healthy path retains one batch read. |
| AUD-02 Missing resources | Pass | Offer, Create Listing, Quality, Item, Bid Form, Batch Details, Order and Job display an unavailable message and recovery action. Existing Crop Details has an Add Crop destination; remote market/insight errors retain their load/retry handling. |
| AUD-03 Clear farm area | Pass | Blank sends farmAreaAcres:null; populated field sends a number; omitted coordinates remain omitted. |
| AUD-04 Onboarding malformed area | Pass | Explicit decimal syntax plus finite positive validation; blank, 1, 1.5 and 12.25 accepted; malformed/trailing-dot/NaN/zero/negative rejected. |
| AUD-05 Partial auction expiry app integration | Pass | Shared deadline checks remove expired open/partial auctions from active UI, show history and release batch selection. Bid actions disappear; Node preflight blocks expired accept/reject requests. |
| AUD-06 Partial pickup/source remainder app integration | Pass | OTP replaces direct pickup. Order allocation and available source remainder remain separate, with no mobile inventory decrement/status mutation. |
| AUD-07 Documentation | Pass | Four current-truth documents updated for functional My Farm, completed grant revocation, pickup, expiry and trust scope. Historical phase reports preserved. |
| AUD-08 Trust semantics integration/docs | Pass | Nullable backend trust and “Quality declaration consistency” retained; unlisted grade-null and A/B/C inventory do not trigger local trust calculations/penalties. |

All seven original failing audit regressions pass: six mobile cases and one server market case.

## Pickup OTP

| Requirement | Result |
| --- | --- |
| Farmer Generate Pickup OTP UI | Pass |
| Logistics Verify Pickup OTP UI | Pass |
| Generate endpoint | Pass |
| Verify endpoint | Pass |
| Wrong-attempt handling | Pass — safe returned attempt metadata |
| Five-attempt handling | Pass — mocked fifth-attempt/exhaustion response |
| Regeneration UI | Pass |
| Direct Confirm Pickup route removed | Yes — authenticated stale request returns 404 without an RPC |
| Direct confirmPickup mobile method and server command removed | Yes |
| Delivery OTP unchanged | Yes — routes, client, UI behavior and returned error semantics preserved |

Farmer generation requires the order Farmer, logistics_advance_paid order, assigned job and advance_paid job. OTP/expiry are selectable component state; regeneration clears the previous display and requests a new code. Display/generation disappear when pickup is no longer pending.

Assigned Logistics gets a secure numeric field limited to six digits in that same pending state. Successful verification clears input, refreshes through the existing action hook, reports “Pickup confirmed. Tracking is now available.” and reveals tracking from authoritative pickup_confirmed state. Invalid/exhausted attempts show remaining attempts or ask for Farmer regeneration. No second confirmation exists.

The server uses session actor IDs, validates six-digit input and strict pickup response fields, and exposes no hash/private RPC fields. The client only calls:

- POST /api/farmer/orders/:orderId/pickup-otp
- POST /api/logistics/orders/:orderId/verify-pickup

Database hashing, 15-minute expiry, actual five-attempt enforcement, regeneration reset, ownership/state enforcement and atomic pickup writes are external RPC responsibilities, not proven by mocked tests.

## Auction expiry

| Requirement | Result |
| --- | --- |
| Expired auction is non-active | Yes |
| Expired partially-sold auction is non-active | Yes |
| Expired bid goes to history | Yes |
| Expired bid cannot be accepted | Yes in UI/Node deadline preflight; atomic DB boundary needs external confirmation |
| Buyer cannot revise/withdraw expired bid | Yes in UI; handlers retain deadline checks for withdrawal |
| One-hour warning notification UI support | Yes |
| Expiry notification UI support | Yes |
| No push-notification dependency added | Yes |

Replaced/outbid/expired bids appear in History; accepted/rejected/withdrawn retain their existing tabs. Quantity bounds still use minimum bid remainder, listing remainder and physical batch remainder, including the audited 55 KG case. Accepted orders are untouched.

Both auction_expiring and auction_expired persist through the workspace DTO, mark read and navigate to canonical Auction Details in mocked tests. The existing entity_type=auction/entity_key=auction ID contract is supported.

Node reads the owned bid's auction deadline before accept/reject; read failure blocks the mutation. This guards stale clients but cannot eliminate a deadline crossing between the read and RPC transaction. The external acceptance RPC must check deadline under its transaction lock before committing an allocation.

Warning creation/deduplication belongs to external demo_expire_marketplace. Existing workspace/marketplace reads invoke it. Exactly one-hour delivery when no client is reading requires external invocation timing; this phase implements no scheduler or background push.

## Preserved functionality

All entries below pass applicable mocked tests/source review; these are not new live E2E or device claims.

| Area | Result |
| --- | --- |
| Login/session tester fixes | Pass |
| My Farm | Pass |
| Auction normal active flow | Pass |
| Fixed Price | Pass |
| Payments | Pass |
| Logistics fee | Pass |
| Tracking | Pass |
| Delivery OTP | Pass |
| Feedback | Pass |
| Market price insight | Pass |

Approved main Farmer Home/My Farm visuals/assets, nine accounts, permanent roles, login OTP rules, FPO Coming Soon, three crops, Sell-only grade declaration, payment splits, simulated labels, inventory allocation rules and ±3% price policy remain intact. No dependency or environment-file changes.

## Database boundaries

| Action | Performed by Codex |
| --- | --- |
| Schema changes | No |
| RLS/grant changes | No |
| RPC definition changes | No |
| Live DB writes | No |
| Reset/cleanup/seeding/live session creation | No |

The retained Farmer2/Buyer1 scenario was not exercised or altered. The completed legacy anon/authenticated grant revocation is documented as external owner work, retaining service_role.

## Automated validation

| Command | Result |
| --- | --- |
| npm run typecheck | Pass |
| npm run test:mobile | Pass; final invocation via npm run test: 67/67 |
| npm run test | Pass; invokes test:mobile |
| npm --prefix server run typecheck | Pass |
| npm --prefix server run build | Pass |
| npm --prefix server test | Pass, 127/127 |
| npx expo export --platform android --output-dir .expo/phase-2-0-16-export | Pass, 1045 modules, 107 assets |
| git diff --check | Pass |

No failed, skipped, cancelled or todo tests in final runs. Initial sandboxed mobile execution failed before tests started with Windows uv_os_get_passwd ENOMEM; the same mocked suite passed outside that sandbox restriction. Git emitted line-ending conversion notices; Expo emitted NO_COLOR/FORCE_COLOR notices. Neither blocked validation.

## Search audit

- Normal src/server/src runtime references to Confirm Pickup, confirmPickup( and /api/logistics/jobs/:jobId/pickup: zero. Retirement assertions remain in tests and this report.
- Pickup references: new generation/verification contracts and UI, pickup_confirmed tracking state, route labels and pickup-location DTOs. None bypass verification or mutate source inventory.
- Delivery OTP: original delivery client/routes/UI retained; shared server result handling preserves delivery behavior.
- expired/partially_sold: mobile helper and history/action filters enforce timestamps; Farmer summary already checks deadlines. Existing Node marketplace/workspace repositories invoke the external expiry RPC; persisted transitions remain its responsibility. Auth session/OTP expiry references are unrelated and unchanged.
- Coming Soon: FPO and Hindi/Marathi language affordances are legitimate future scope. The unmounted RoleDashboardPlaceholder and generic unknown Home-destination fallback are retained; canonical implemented Home/My Farm navigation remains covered and functional.
- Designer screen pack and historical phase documents are preserved as briefs/history; they do not override updated current requirements.

## Files changed

Production:

- server/src/repositories/mutation.repository.ts
- server/src/routes/mutation.routes.ts
- server/src/services/market.service.ts
- server/src/services/mutation.service.ts
- server/src/types/mutations.ts
- src/screens/FarmerFarmScreens.tsx
- src/screens/FarmerScreens.tsx
- src/screens/trading/BuyerLogisticsScreens.tsx
- src/screens/trading/FarmerSellScreens.tsx
- src/screens/trading/SharedScreens.tsx
- src/services/api/listingState.ts (new)
- src/services/api/mutation.client.ts
- src/services/api/mutation.types.ts

Tests:

- server/src/repositories/trading.repository.test.ts
- server/src/routes/mutation.routes.test.ts
- server/src/services/phase-2-0-16.test.ts (new)
- tests/farmer-farm-ui.test.ts
- tests/trading-ui.test.ts
- tests/phase-2-0-15.audit.test.ts (pre-existing untracked; loader/fixture completion only)
- tests/phase-2-0-16.test.ts (new)

Documentation:

- README.md
- PROJECT_REQUIREMENTS.md
- DEVELOPMENT_GUIDE.md
- AGENTS.md
- PHASE_2_0_16.md (new)

Pre-existing untracked PHASE_2_0_15_TEST_AUDIT.md and server/src/services/phase-2-0-15.audit.test.ts remain preserved. Ignored Android export/build output is not a source change.

## External Supabase handoff still required

Code expects all four: **yes**.

1. demo_generate_pickup_otp(p_farmer_account_id uuid, p_order_id uuid): return orderId, six-digit otp, expiresAt; validate Farmer ownership, assignment and paid states; hash storage, 15-minute validity and regeneration resetting attempts.
2. demo_verify_pickup_otp_v2(p_logistics_account_id uuid, p_order_id uuid, p_otp text): assigned actor/state checks, persist failed attempts with safe committed result metadata, five-attempt exhaustion, atomic success to order/job pickup_confirmed, event/notifications; do not change the remaining source batch to in_transit or subtract allocation again.
3. Updated demo_expire_marketplace(): idempotent warning one hour before expiry only for actionable bid remainder; expire open/partial auctions and unaccepted bid remainders; expiry notification for unsold quantity; accepted orders remain valid and unsold produce relistable.
4. Updated demo_recalculate_trust(): selling/listing workflow declaration scope, exclude unlisted/ungraded inventory and do not penalize Grade C.

Before rollout, the owner must also confirm atomic acceptance deadline enforcement and invocation timing for one-hour notifications. No definitions were invented/deployed here.

## Remaining blockers

- External RPC deployment/verification above is required for live Pickup OTP, persisted Option A expiry/notifications and corrected trust.
- Strict one-hour notification timing and acceptance-at-deadline races require the external guarantees described above.
- Device/manual live verification remains unperformed by instruction. No local test/build failures remain.

No commit or push performed.
