# Phase 2.0.15 — Comprehensive test-only audit

## Baseline

HEAD: `d49cb2894fa2b011afaeefeba13fb9e230bb927c`. Starting working tree clean. No production changes or live mutations authorized.

## Expected behavior matrix (established before testing)

| Area | Expected behavior | Verification approach |
| --- | --- | --- |
| Common auth | Nine fixed accounts, six numeric mock OTP digits, permanent role, remembered role, restored/revoked sessions, logout preserves onboarding | Provider/service/navigation inspection; mocked tests |
| Farmer onboarding | Language/login/role then Personal/Farm/Review/Submitted; 11-digit Farmer ID; optional area; photo preview; completion only on Submit | Screen validation and navigation inspection |
| Farmer Home | Actor-scoped inventory/auctions/offers/completed monthly sales; auction-only opportunity; no Trust or invented data | Summary/repository tests and rendering inspection |
| My Farm | Eleven routes; current positive non-terminal versus sellable available inventory; first/additional batches; null grade; safe edit/maps/activity | Existing mocked UI/service/client tests; targeted probes |
| Sell/Buyer | Auction/fixed flows, quantity bounds, partial acceptance, revision history, locked fixed price, 10–90% advance, no auto-award | UI/Node/RPC adapter inspection; existing and targeted tests |
| Orders/payments | Valid transitions; allocation reconciliation; simulated payments; Buyer logistics fee, zero platform fee, 40/60 split; no duplicates | Inspect local business enforcement versus delegated RPC boundary |
| Logistics/delivery | Atomic eligible claim; assigned actor; fee reproposal; pickup/tracking; labelled simulation; OTP confirms delivery, max five attempts/regeneration | Local routes/services/UI tests; distinguish deployed-only guarantees |
| Feedback/trust | Completed-order participant graph, 1–5 rating, no duplicates, backend trust, Grade C independent, nullable trust | Local validation/adapters/UI inspection |
| Market | Three crops; official normalization and accurate provenance; honest fallback; historyMany; bounded contextual modifier | Injected repository/fetch tests; inspect write side effects |
| Security | Session/role/actor enforcement; expired/revoked/disabled rejection; no client secrets or secret logs; no legacy mobile RPC | Route/repository/client audit and mocked tests |
| Navigation/errors | Registered destinations, no dead implemented CTAs, FPO-only legitimate placeholder; empty/loading/offline/401/403/404/409/500 handling | Static route/search classification and mocked render tests |
| Local API | Health and safe read-only behavior; preserve manual Farmer2/Buyer1 scenario | Inspect side effects before requests; never create a session |
| Android | Export resolves runtime imports/routes; optional existing ADB inspection | Android export; no transaction taps |

## Evidence levels and boundaries

Audit date: 2026-09-19. **No production files changed. No live DB writes performed.** No reset, cleanup, seeding, session creation/revocation, marketplace mutation, commit, push or branch operation. Only this report and two new test files were created. README/product docs were deliberately left unchanged.

- **Automated:** executed current production functions/screens with injected dependencies; no live business mutations.
- **Static:** inspected current mobile/Node code and deployed PostgreSQL function definitions/constraints/grants using SELECT inside explicit read-only transactions. Reading a function definition is not executing it.
- **Live read:** health/readiness, unauthenticated rejection checks, direct read-only aggregate/manual-scenario database inspection.
- **Not exercised:** live mutation E2E, concurrency races, device taps, permission dialogs, camera/gallery or Maps. Source-confirmed database issues below are not claimed as live mutation reproductions.

Read first: README, PROJECT_REQUIREMENTS, DEVELOPMENT_GUIDE, AGENTS, phases 2.0.11/12/14, designer INDEX and MASTER_FLOW. Historical E2E reports are context, not evidence that the current build passed live E2E.

## Automated validation

| Command | Baseline result | Final result with audit regressions |
| --- | --- | --- |
| npm run typecheck | Pass | Pass |
| npm run test:mobile | 48/48 pass | **55 tests: 49 pass, 6 fail** |
| npm --prefix server run typecheck | Pass | Pass |
| npm --prefix server run build | Pass | Pass |
| npm --prefix server test | 110/110 pass | **111 tests: 110 pass, 1 fail** |
| npx expo export --platform android --output-dir .expo/phase-2-0-15-audit | Pass: 1,044 modules, 107 assets | Production unchanged after export |
| git diff --check | Pass | Pass |

The seven expected-behavior failures are intentionally left failing, not skipped or changed to assert defective behavior. They reproduce AUD-01 through AUD-05. No original test regressed. Tests ran outside the known Windows tsx sandbox OS-user-lookup restriction. Typechecks/build ran normally.

### Test coverage added

- `tests/phase-2-0-15.audit.test.ts`: seven tests. One passing matrix exercises ten auction/fixed acceptance cases, including min(55 bid, 150 auction, 450 physical) = 55 KG, each limiting dimension and zero. Six failing tests cover three missing-resource screens, clearing farm area, malformed onboarding area and expired partial-auction history.
- `server/src/services/phase-2-0-15.audit.test.ts`: one failing injected-fetch/repository test proves batched official data is discarded on DB outage. No live government request.

Existing tests cover session lifecycle, remembered roles, role navigation, strict DTOs, token-scoped 401 cleanup, nine-account mock OTP behavior, My Farm current/sellable semantics, null trust, empty roles, crop-filtered Sell, authenticated ownership, command parameter validation, 401/403 and RPC error translation, OTP v2 result metadata, market normalization and the exact contextual modifier.

## Local server/API and read-only live evidence

Started the freshly built current app on an ephemeral localhost port and closed the listener afterward. No existing service was stopped or replaced.

| Request | Result |
| --- | --- |
| GET /health | 200, ok true |
| GET /ready | Initially 503 under restricted networking; **200 outside sandbox**, Supabase ready |
| GET /api/demo/me without bearer | 401 invalid_session |
| GET /api/workspace without bearer | 401 invalid_session |
| GET /api/farmer/my-farm-summary without bearer | 401 invalid_session |
| GET /api/market/Tomato/current without bearer | 401 invalid_session |
| GET /audit-missing | 404 |

**Authenticated GETs were intentionally not called.** `middleware/auth.ts:32` writes session last_seen_at. `trading.repository.ts:22` calls demo_expire_marketplace, and normal market service injection includes the cache writer. HTTP GET alone does not satisfy this phase's no-write constraint. `/ready` only selects an account ID. Direct SELECT inspection provided live evidence without those side effects; no raw session token, hash or OTP was selected.

At read time, live data had progressed beyond the prompt's earlier snapshot:

| Observation | Value |
| --- | --- |
| Accounts / Farmer / Buyer / Logistics profiles | 9 / 3 / 3 / 3 |
| Batches / auctions / bids / orders | 1 / 1 / 2 / 1 |
| Official / demo mandi rows | 205 / 0 |
| Sessions | 21; 10 active, 6 expired, 5 revoked (aggregate inspection) |
| Farmer2 Onion batch | Original 650 KG; remaining 450 KG; available; Grade A |
| Auction | Offered 350 KG; remaining 150 KG; partially_sold |
| Buyer1 bids | Previous 200 KG replaced; current 255 KG partially_accepted |
| Allocated order | 200 KG; total INR 8,540; 30% Farmer advance; logistics_fee_pending at inspection |
| Current bid's further acceptance limit | min(255−200, 150, 450) = **55 KG** |
| Batch reconciliation | 650 = 450 + 200, true |
| Invalid batch/auction/fixed quantity bounds | 0 / 0 / 0 |
| Latest stored official observations | All three crops dated 2026-09-19 |

The auction ends 2026-09-20T12:40:42.05739Z and was not expired at inspection. AUD-05 is therefore a future-state reproduction using an expired fixture and deployed source, not a claim the current auction is already expired. Manual users can continue changing live state; these figures are observations, not constants or proof of unchanged counts throughout the audit.

## Role and screen results

### Farmer

| Area | Result |
| --- | --- |
| Onboarding | Flow registered; exact 11-digit Farmer ID enforced; area optional; camera/gallery/preview/cancel/done wired; malformed area defect AUD-04. Completion marker written only by Submit; no profile persistence claimed. |
| Home | Existing summary/mapping tests pass: current inventory, live actor ownership, auction-only opportunity, no fake empty opportunity, unread bid/revision counts, completed-month sales, no Trust Score. Market outage defect AUD-01. |
| My Farm | All eleven secondary components registered and paths wired: Overview, Edit Farm, My Crops, Add Crop, Available Produce, Add Produce, Crop Details, Physical Batches, Batch Details, Activities, Location. Zero/current/sellable/null-grade/coordinate behavior covered. Clear-area defect AUD-03. |
| Sell | Batch filter and canonical Quality/Price Insight/Choose Method/Auction/Fixed paths inspected and tested; no quality step in inventory creation. Missing-resource forms AUD-02; expiry lifecycle AUD-05. |
| Offers | Acceptance cap correct across bid/request, listing and physical remainder. Partial acceptance is supported, not an error. Missing offer AUD-02. |
| Orders | Actor-visible orders, states, payment/timeline/tracking and participant profiles wired. Core state enforcement delegated to inspected RPCs. |
| Profile | Nullable trust/reliability rendered honestly; logout wired; no editable trust. |
| Notifications | Home/My Farm target canonical nested notifications; mark-read is actor-phone scoped; canonical order/job/listing/offer links inspected. Live mark-read not invoked. |

### Buyer

| Area | Result |
| --- | --- |
| Home / Market | Honest empty states, current date/status filters, nullable trust; tabs and notifications wired. |
| Auction | Reserve/quantity/advance bounds present; new bid only while open, no automatic winner. Existing eligible partial bids remain accept-able by Farmer. |
| Fixed | Price locked; only quantity/advance/delivery submitted; partial requests supported without counteroffer. |
| Bids | Revision marks previous bid replaced; unique partial index permits one active bid per buyer/auction. UI history fallback includes replaced rows; withdraw before acceptance. |
| Requests | Pending request duplicate guard; Farmer accepts existing price/advance terms with bounded quantity. AUD-02 covers missing proposal item. |
| Orders / Payments | Accepted percentage shown; explicit simulated payment confirmation; backend determines amounts; no client-supplied payment amounts. |
| Profile | Nullable trust and sign-out wired. |

### Logistics

| Area | Result |
| --- | --- |
| Home / Jobs | Available/assigned/history filters; capacity and verification eligibility inspected; honest empty states. |
| Claim | RPC locks job, checks verified enabled Logistics/capacity, and conditionally assigns only an available unclaimed job. Conflict maps to 409. No live race run. |
| Fee | Assigned-only proposal; Buyer response; rejection returns to reproposal state; 40% advance required before pickup. |
| Tracking | Real Expo Location permission/position path; explicit source actual; simulated option is labelled and development-only in UI. No position sent. |
| OTP | Assigned Logistics input; v2 backend path, five-attempt cap, persisted wrong attempts, expiry and regeneration reset verified in deployed source. OTP verification itself sets delivery/balance_pending. |
| History / Profile | Delivered/completed history, final-balance-pending wording, nullable trust, vehicle/capacity and logout wired. |

### Cross-role business and consistency

- **Inventory:** acceptance RPCs lock bid/request, listing and physical batch; validate all three remaining limits; insert the order and decrement listing/batch in the same function. Database checks prohibit negative and greater-than-original/offered quantities. Current manual allocation reconciles. Pickup-level remaining-stock issue AUD-06.
- **Payments:** row-locked state/Buyer guards; Farmer advance = round(total × accepted percent / 100, 2); Farmer final = total minus rounded advance; logistics = round(fee × .40, 2) and round(fee × .60, 2). No platform payment kind or deduction; Buyer pays both logistics records. UNIQUE(order_id,payment_kind) plus state checks prevents duplicate rows. No live payment replay performed.
- **State sequence:** farmer_advance_pending → logistics_pending → logistics_assigned → logistics_fee_pending → logistics_advance_pending → logistics_advance_paid → pickup_confirmed → in_transit → delivery_otp_pending → balance_pending → completed. Job independently reaches delivered at successful OTP. Events record paid/delivered transitions; not every conceptual step is a separate order status.
- **Delivery:** wrong OTP returns structured failure after persisting the attempt (rather than raising and rolling it back). At five attempts verification blocks; regeneration resets to zero and refreshes expiry. Success changes job to delivered and order to balance_pending; no second confirmation UI.
- **Feedback:** completed-order participant checks allow all six directed counterpart edges, reject self/nonparticipants, rating constrained to 1–5. UNIQUE(order,from,to) and upsert prevent duplicate rows; re-submission updates existing feedback. Recipient trust recalculates; all participants recalculate at completion.
- **Trust:** Grade A/B/C count equally toward declaration consistency; Grade C does not itself penalize trust. Nullable UI is honest. Ungraded unsold inventory can affect the consistency denominator: AUD-08.
- **Notifications:** RPCs create actor/participant notifications; workspace strips delivery OTP notification body and resolves entity IDs against visible entities. Mark-read callback navigates only after success; errors remain visible.

## Market and price

Official data.gov.in/AGMARKNET adapter, configured credentials on server only, Maharashtra/district filtering, date/price validation and INR/Quintal → INR/KG conversion remain intact. Existing normalization/fallback tests pass. Stored official observations were inspected; no current government HTTP request was needed or claimed in this phase.

Single-crop history preserves valid official results on DB/cache outage. Batched history has AUD-01; it still performs one batched repository call. Its 1.5-second response race may use stored fallback while a slower official fetch completes; that timing is part of the tester implementation, not evidence of fake prices. Farmer market UI is primarily INR/Quintal; insight remains Current/Min/Max/Suggested/Next 7 Days without raw diagnostics.

Exact contextual policy tests pass: A +1.5%, B/null 0, C −1.5%; high demand +1.5%, moderate +0.5%, low 0; quantity <500 KG 0, 500–999.99 −0.5%, >=1000 −1%; combined clamp ±3%. Market momentum/statistics remain primary. Optional AI changes explanation only, not numeric prices; no trained-model or certification claim.

## Auth/security

Session restoration/logout/revoked/expired/disabled checks pass mocked tests; permanent remembered role and Farmer completion survive logout. Web adapter remains AsyncStorage, native adapter SecureStore. No extra credential storage added. The development strategy accepts exactly six numeric digits, fixed account lookup is server-authoritative, and real SMS was not called.

Every mounted route was reviewed: health/readiness public; demo login creates a fixed-account session; logout/me and public-profile reads require a session; legacy role-specific reads use role/session; order reads check participant ownership; summary/inventory writes require Farmer; all 25 command routes derive actor from session and apply declared role guards. Feedback/disputes use participant RPC authorization. Notifications scope by session phone. Integration workspace filters private offers/orders/payments/tracking to the actor; profile data is intentionally public operational data.

Read-only database metadata confirms RLS enabled and anon/authenticated SELECT disabled on all 23 inspected demo tables. All inspected demo functions deny anon/authenticated EXECUTE. The five retired mobile RPCs **already deny anon/authenticated and retain service_role**; the pending-revocation documentation is stale (AUD-07). No grants were changed.

Runtime mobile source has no direct RPC invocation/service-role usage. Source scan found no secret EXPO_PUBLIC patterns. An in-memory scan for configured server private credential values found **0 matches across 89 src files and 109 export files**; only match counts were printed. Logging review found a startup port, generic API-config message and truncated database session error messages; no explicit raw bearer/OTP/market-key logging path. This scoped check is not a full repository-history/dependency security audit.

## Navigation and empty/error states

Inspected all six navigator files plus ProtectedRoute, typed Home/My Farm actions, nested Sell/Insights routes, role tabs, shared pages and notification deep-links. No missing registered component or type-invalid destination found; typecheck and export pass. Back handlers are wired. Native screen stacking, gesture behavior and safe-area pixel layout remain unverified.

Search classification (`Coming Soon`, `Alert.alert`, `navigation.navigate`, `navigation.replace`, `getParent`):

- Implemented My Farm: zero Coming Soon/stub fixture paths.
- RoleSelection FPO: legitimate future feature. AuthScreens contains duplicate legacy FPO/role-placeholder exports not mounted in current role navigators.
- LanguageSelection Hindi/Marathi: explicitly unavailable localization options, not an implemented marketplace feature regression; English continues.
- useFarmerHomeAction fallback: defensive Coming Soon branch; current finite Destination union is covered by preceding handlers and tests.
- Other alerts: image permissions/source picker, role unavailable/selection failure, form persistence failure, logout confirmation/error, irreversible rejection confirmation and explicitly simulated payment confirmation. None recreates My Farm Coming Soon.
- `getParent`: trading bottom tabs target Farmer root; empty SelectBatch opens root MyFarm. Nested Sell/Insights entry points pass the required batch/crop IDs. Secondary My Farm pages use back navigation rather than a persistent bottom tab bar; no dead tab was claimed from that design.
- Dead/empty contexts: three missing-resource screens in AUD-02; expiry makes History/close/relist paths inconsistent in AUD-05.

Farmer zero crops/batches/auctions/offers, missing coordinates, nullable trust and market unavailable states are covered by existing tests/inspection. Buyer zero listings/bids/requests/orders and Logistics zero available/active/history have real empty messages. No fixture fallback is introduced. LoadState distinguishes first-load errors, cached refresh errors and mutation errors; hooks retain cached data and ignore obsolete request results. Current-token 401 clears auth; 403/404/409 and server/network failures become error messages; 409 requests refresh. Missing-resource success responses remain a gap (AUD-02). No offline device session walkthrough performed.

## Issues found

| ID | Severity | Role | Area | Summary | Reproducible evidence |
| --- | --- | --- | --- | --- | --- |
| AUD-01 | MEDIUM | Farmer | Market/Home | Batched DB failure discards successful official observations | Failing injected-service test |
| AUD-02 | MEDIUM | Farmer/Buyer | Detail/forms | Missing offer/batch/item renders no unavailable message | Three failing mocked screen tests |
| AUD-03 | MEDIUM | Farmer | Edit Farm | Clearing optional area reports save but retains old value | Failing submit payload test |
| AUD-04 | LOW | Farmer | Onboarding | Malformed decimal area advances to Review | Failing real-handler test |
| AUD-05 | HIGH | Farmer/Buyer | Auction expiry | Expired partial auction remains active in storage and blocks normal relisting/history | Deployed source + failing History test; not current live expiry |
| AUD-06 | MEDIUM | Farmer/Logistics | Partial pickup | Pickup hides unsold source-batch remainder from sellable inventory | Deployed source + current/sellable implementation; no mutation replay |
| AUD-07 | LOW | All/developer | Documentation | README phase/write status and pending grant handoff are stale | Current files versus code/deployed privilege SELECT |
| AUD-08 | MEDIUM | Farmer | Trust | Unlisted null-grade batches dilute declaration consistency | Deployed function definition; no trust recalculation invoked |

No BLOCKER was demonstrated. Severity describes the supported prototype scope, not production deployment readiness.

### AUD-01 — Batched market fallback loses valid official data

- **Screen/endpoint:** Farmer Home summary, `createMarketService().historyMany`.
- **Steps:** Inject a repository whose batched history rejects; inject a successful normalized government response; request Tomato historyMany.
- **Expected:** Retain official observations even when DB history is unavailable, as single-crop history does.
- **Actual:** Promise rejects with the DB error. Summary catches the batch failure and produces no market cards.
- **Evidence:** `server/src/services/phase-2-0-15.audit.test.ts:7`; `market.service.ts:89` uses uncaught Promise.all for stored results. Existing single-history outage test passes.
- **Likely cause:** Batched optimization omitted the single-history fallback policy.
- **Suggested fix scope:** Market service only; preserve batching, bound official wait, independently handle DB failure.
- **Regression:** Added and failing. No production fix.

### AUD-02 — Three missing-resource screens render an unexplained empty body

- **Screens:** Offer Details, Create Listing, Buyer Bid/Purchase Request form.
- **Steps:** Render with loaded workspace and an absent route offerId/batchId/itemId (stale link, removed visibility or stale navigation).
- **Expected:** Explain resource unavailability and provide a way to refresh/back/open the relevant list.
- **Actual:** Success-state wrapper renders without the resource body or missing-resource message.
- **Evidence:** Three audit tests; `FarmerSellScreens.tsx:77,114` and `BuyerLogisticsScreens.tsx:56` use only conditional resource rendering. Item, Order and Job already have explicit unavailable messages.
- **Likely cause:** Missing else branch for a successfully loaded but absent entity.
- **Suggested fix scope:** Three UI empty states; retain ownership rules.
- **Regression:** Three added failing tests. Workaround: back to list.

### AUD-03 — Clearing farm area does not clear saved data

- **Screen/endpoint:** Edit Farm → PATCH /api/farmer/farm.
- **Steps:** Existing area 3 acres; erase the optional area field; Save.
- **Expected:** Explicitly cleared optional area persists null, or UI clearly states that blank preserves the existing value.
- **Actual:** `farmAreaAcres` omitted, so server preserves 3; success message still displays.
- **Evidence:** `FarmerFarmScreens.tsx:98`; failing regression receives undefined instead of null. Server whitelist already supports explicit null.
- **Likely cause:** Blank-value omission conflates unchanged and deliberately cleared fields.
- **Suggested fix scope:** Track clear/dirty intent in Edit Farm; preserve omitted coordinates as currently designed.
- **Regression:** Added and failing. Direct API null is technically supported but not an in-app workaround.

### AUD-04 — Invalid optional onboarding area passes validation

- **Screen:** Farmer Farm Details.
- **Steps:** Complete location/crop fields; input `1..2` (input permits multiple dots); press Next.
- **Expected:** Reject a nonfinite/malformed quantity; optional blank remains valid.
- **Actual:** Navigates to Review because `Number('1..2')` is NaN and NaN <= 0 is false.
- **Evidence:** `FarmerScreens.tsx:979,1011`; failing audit invokes the actual Next handler and records navigation to Review.
- **Likely cause:** Only <=0 checked, without finite/decimal validation.
- **Suggested fix scope:** Onboarding validation only; no persisted profile changes.
- **Regression:** Added and failing. LOW because onboarding is local UX state; user can correct the field.

### AUD-05 — Partially sold auctions do not expire and can strand relisting

- **Areas:** Deployed demo_expire_marketplace/demo_create_auction/demo_create_fixed_listing; Buyer Market, Farmer Item, Select Batch and Selling History.
- **Steps:** Partially accept an auction; leave a positive remainder; let ends_at pass. This was modeled with a fixture, not performed live.
- **Expected:** Expiry stops new bids without auto-award, leaves eligible existing offers governed by policy, shows historical state and permits a coherent close/relist path.
- **Actual:** Expiry SQL updates auctions only `where status='open'`; partially_sold remains forever. Buyer Market filters past end time, History excludes partially_sold, Item hides Close Early after end, and listing creation/SelectBatch still treat the batch as already listed. Existing eligible bids can still be accepted; this does not repair the no-more-bids remainder case.
- **Evidence:** Read-only pg_proc source; `FarmerSellScreens.tsx:20,43,84`; `SharedScreens.tsx` History status filter; failing AUD-05 History test.
- **Likely cause:** Partial status added to acceptance/listing guards but omitted from auction expiry.
- **Suggested fix scope:** Separate authorized RPC expiry correction plus UI lifecycle regression; preserve no-auto-award and valid residual acceptance. No DB change in this audit.
- **Regression:** UI failure added; transactional partial-expiry/relist test needed in a disposable DB. Current manual auction was still before its end time.

### AUD-06 — Pickup changes the status of unsold physical remainder

- **Areas:** Deployed demo_confirm_pickup; My Farm/Home current-versus-sellable totals.
- **Steps:** Allocate part of a larger batch, then progress that order to pickup while unsold remaining KG exists.
- **Expected:** Only allocated produce is in transit; unsold remaining physical stock stays available under listing rules.
- **Actual from source:** Pickup unconditionally executes `update demo_inventory_batches set status='in_transit' ... where id=v_o.batch_id`. Remaining quantity had already been reduced on acceptance. Sellability requires status available, so the unsold remainder disappears from available-to-sell until OTP resets status to available. Further order acceptance may also overwrite the aggregate status.
- **Evidence:** Deployed demo_confirm_pickup and demo_verify_delivery_otp_v2 definitions; `server/src/utils/farmerInventory.ts`; acceptance SQL decrement. Source-confirmed consequence; no live pickup was performed.
- **Likely cause:** A single batch lifecycle status is used for both remaining stock and individual allocated deliveries.
- **Suggested fix scope:** Separate inventory availability from per-order/job delivery lifecycle using existing order/job state; design in a separately authorized DB change phase.
- **Regression:** Disposable-DB partial pickup/delivery with multiple orders and positive unsold remainder required. Not a proven oversell or lost-KG defect.

### AUD-07 — Current documentation contradicts implemented/deployed state

- **Areas:** README:5,21,25; AGENTS:58; PROJECT_REQUIREMENTS:129; historical handoff references.
- **Steps:** Compare current README My Farm write/phase statements and pending grants to restored routes and has_function_privilege SELECT.
- **Expected:** Current docs describe 2.0.14 functional My Farm and completed external revocation; historical reports remain historical.
- **Actual:** README points to 2.0.12 and says unsupported writes remain unavailable; three current docs still say the five legacy grants await revocation, although anon/authenticated=false and service_role=true for all five.
- **Likely cause:** Selective restoration updated some docs while preserving old handoff text.
- **Suggested fix scope:** Later documentation-only cleanup; do not revoke again or modify historical evidence.
- **Regression:** Review/checklist sufficient. No README/product docs changed here.

### AUD-08 — Ungraded unlisted stock lowers declaration consistency

- **Area:** Deployed demo_recalculate_trust.
- **Steps:** A Farmer has declared listed produce; add another current batch (correctly created with null grade), leave it unlisted, then a legitimate completion/feedback causes trust recomputation.
- **Expected:** Declaration consistency measures produce requiring a declaration in Sell, without penalizing unsold inventory for not yet entering that step. Grade C should count equally.
- **Actual from source:** Denominator counts every batch belonging to the Farmer, without any listing predicate; numerator counts nonnull A/B/C farmer_declared batches. One declared batch plus one unlisted null-grade batch gives 50% instead of 100%, reducing the weighted consistency contribution by 10 points, other inputs equal.
- **Evidence:** Read-only deployed definition uses only `where farmer_account_id = p_account_id`; restored batch creation sets grade null. No recalculation called and no live score change claimed.
- **Likely cause:** Historical all-batch denominator predates the restored ungraded inventory creation flow.
- **Suggested fix scope:** Clarify listing-eligible declaration denominator and adjust externally owned trust RPC only in an authorized later phase. Keep A/B/C equal.
- **Regression:** Disposable-DB comparison before/after unlisted batch, null-grade versus listed A/B/C, with equal feedback/completions. Source-confirmed; no automated mutation reproduction here.

## Correct-but-confusing behavior — NOT A BUG

1. The current 55 KG acceptance cap is correct even though auction remainder is 150 KG and physical stock is 450 KG. The current 255 KG bid already allocated 200 KG. “Use full remaining quantity” means the maximum for this offer, not all auction stock; label could be clearer.
2. Farmer may choose any eligible bid, not necessarily the highest. Partial acceptance leaves listing remainder for other eligible existing bids; no automatic winner on expiry.
3. Auction may offer less than the full batch. SelectBatch excludes batches with a current listing to prevent duplicate active listing creation; available physical stock and immediately relistable stock are not identical.
4. New crop/produce grade is null until Sell Quality. This is deliberate, not missing quality creation data.
5. OTP success itself delivers; order moves directly to balance_pending while job is delivered. No second Confirm Delivery button is needed.
6. Re-submitting feedback updates the unique existing row, not a duplicate feedback record.
7. FPO and Hindi/Marathi localization placeholders are explicit future scope. Legacy unmounted placeholder exports are not live role dashboards.
8. Health/readiness can succeed without an authenticated workspace smoke test. A GET can still have persistence side effects; those routes were not safe to exercise with a real bearer in this audit.

## Android/runtime readiness

Android export passed. Three existing emulators were listed: emulator-5554, emulator-5556, emulator-5560. Read-only package inspection found com.farmprism and Expo Go; current app.json declares com.anonymous.FarmPrism, so package/build correspondence was not established. Resumed-activity query yielded no matching line.

For each emulator, a bounded existing logcat query (last 500 matching error records, ReactNativeJS/AndroidRuntime tags) produced zero FATAL EXCEPTION, TypeError or unhandled-navigator matches. Only aggregate counts were printed to avoid exposing logs containing credentials/OTP. This does not prove a running app is healthy, logs are complete, or the current export is installed. No app launch, reload, taps, screenshot, log clearing or runtime transaction took place.

## Remaining unverified areas and coverage gaps

- No fresh live login/session, marketplace mutation, payment, tracking point, OTP attempt, feedback, reset or cleanup. Full live Auction/Fixed E2E requires separate authorization.
- Existing Node mutation tests largely assert RPC selection, actor/input validation and conflict mapping. They do **not** execute PostgreSQL state transitions or prove race safety. Current deployed definitions, constraints and read-only data were inspected, but concurrency needs a disposable DB test environment.
- Priority DB tests: simultaneous partial accept/oversell across bids and listing types; duplicate/revised active bid races; first Logistics claim; invalid/repeated payments; unique payment reconciliation; 40/60 rounding; OTP attempt persistence/regeneration/expiry; feedback participant graph/upsert/trust; partial pickup and expiry (AUD-05/06/08).
- No local SQL migrations/function definitions were present in the repository (`rg --files -g '*.sql'` returned none). The reviewed deployed definitions are external; use a controlled fixture/snapshot environment for future executable DB tests, not this manual scenario.
- No device-level photo permission/cancellation, actual GPS, Maps opening, keyboard/safe-area layouts, back gestures, offline reconnect or mounted navigation walkthrough. Static wiring and mocked screens cannot prove those.
- Existing market rows prove stored official data is present, not a new government-request success. Private-key scan covered current source/export only, not history or all dependencies.
- No universal “every possible defect” guarantee. Findings above distinguish reproduced tests, source-confirmed scenarios and unverified runtime behavior.

## Final change boundary

- Live DB writes performed: **NO**.
- Production files changed: **NO**.
- README/product docs changed: **NO**.
- Added files only: this report and the two explicitly listed audit test files.
- Final working tree intentionally has those three untracked files; original tracked files have no diff.
- No commit or push.
