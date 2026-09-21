# Phase 2.0.17 — Database completion and handoff

## Status and baseline

Completed on 2026-09-19. The scoped migration is deployed to FarmPrism Supabase project `edfpbfhkbqavpxabdonv` (ap-northeast-1, PostgreSQL 17.6.1.166). Phase 2.0.16 application code and UI are unchanged.

- Branch: `Development`.
- Starting and final HEAD: `fe52152b235eb4f6fdf0444524e9178e5c43687c`.
- Commit: `2.0.16 — Fix Audit Regressions + Add Farmer Pickup OTP`.
- Parent: `d49cb2894fa2b011afaeefeba13fb9e230bb927c`.
- Starting working tree was clean. Final tree contains only the eight files listed below; no commit, push, checkout, stash, reset or branch change.
- User explicitly authorized this database handoff, superseding the previous phase's prohibition on database edits.
- No demo reset, cleanup, seed, retained-scenario mutation, session creation or private environment change.

## Live state inspected before changes

The two Pickup OTP RPCs and a separate pickup OTP table were absent. Delivery OTP had its own table and working generation/verification functions. The obsolete service-role-executable `demo_confirm_pickup` directly confirmed pickup and marked the entire source batch in_transit.

Both acceptance functions locked the offer, parent and physical batch, but accepted persisted expired parent status and had no under-lock deadline check. Expiry handled open auctions, not partially_sold auctions, and did not expire bid remainder; Fixed Price already handled active/partially_sold parents. Bid/request constraints lacked expired status. Farmer trust counted every inventory batch, including unlisted grade-null produce.

Inspected counts: 9 accounts, 2 batches, 2 auctions, 2 bids, 0 fixed listings, 0 purchase requests, 1 completed order, 1 logistics job, 4 payments, 22 notifications and 1 Delivery OTP record. These are the actual current records, rather than an assumed reconstruction of historical E2E scenarios.

Inspected ownership, effective grants, constraints, indexes, function definitions, dependencies, triggers and pgcrypto. Existing privileged demo functions were postgres-owned SECURITY DEFINER with empty search_path and service_role execution only. No runtime application caller, public SQL-source caller or catalog dependency required direct pickup. No custom demo-table trigger needed adjustment. No pg_cron extension or cron.job relation existed; no database scheduler was added.

## Applied migration and schema

Remote migration version: `20260919150633`, name: `phase_2_0_17_database_handoff`.

Local SQL: `supabase/migrations/20260919150633_phase_2_0_17_database_handoff.sql`. The Supabase CLI generated the initial scaffold; its filename was aligned with the version returned by the remote migration history. This file records an already-applied migration, not a command to replay against this project. It depends on the inspected existing schema; this repository is not a complete fresh-database bootstrap.

Changes:

1. Added `public.demo_pickup_otps`: order_id primary/foreign key with ON DELETE CASCADE, SHA-256 code_hash, expires_at, attempt_count (0–5), verified_at and created_at. Hash-format and positive validity-window constraints apply. No plaintext column.
2. Enabled RLS and denied PUBLIC/anon/authenticated table privileges; service_role has SELECT/INSERT/UPDATE/DELETE.
3. Extended existing bid/request status constraints with expired, preserving all prior allowed values.
4. Added partial unique index `demo_auction_lifecycle_notification_once` on account_id/notification_type/entity_type/entity_key for auction_expiring and auction_expired auction notifications only. Existing data had no conflicting duplicates.
5. Added two Pickup RPCs, replaced four scoped existing business functions and disabled the old direct pickup function.
6. No backfill or business-function invocation occurred in deployment. Existing trust rows are recalculated through normal application behavior, not a deployment-time rewrite.

## Exact RPC signatures

All return jsonb:

```sql
public.demo_generate_pickup_otp(p_farmer_account_id uuid, p_order_id uuid)
public.demo_verify_pickup_otp_v2(p_logistics_account_id uuid, p_order_id uuid, p_otp text)
public.demo_accept_bid(p_farmer_account_id uuid, p_bid_id uuid, p_accept_quantity_kg numeric)
public.demo_accept_purchase_request(p_farmer_account_id uuid, p_request_id uuid, p_accept_quantity_kg numeric)
public.demo_expire_marketplace()
public.demo_recalculate_trust(p_account_id uuid)
-- Retired, deliberately unusable:
public.demo_confirm_pickup(p_logistics_account_id uuid, p_job_id uuid)
```

The six active RPCs are postgres-owned SECURITY DEFINER with empty search_path, explicit object qualification, no PUBLIC/anon/authenticated execution and service_role execution. The retired RPC retains its signature as a SECURITY INVOKER stub with empty search_path. Execution is revoked from all API roles, including service_role; even an owner call raises PICKUP_OTP_REQUIRED. It was not blindly dropped.

## Pickup OTP behavior

Generation requires an enabled owning Farmer, order logistics_advance_paid and an assigned advance_paid logistics job. Locks are order → job → OTP. Six-digit numeric codes use pgcrypto secure random bytes with rejection sampling; SHA-256 storage follows the separate Delivery OTP storage convention. Regeneration guarantees a different code from the immediately previous one, replaces the hash, resets attempts and grants a fresh 15 minutes. Only orderId/otp/expiresAt are returned. Generation events contain expiry metadata, never the code or hash.

Verification requires six numeric digits and an enabled assigned Logistics account. The same locks serialize generation/verification. Unavailable, expired, wrong-stage and wrong-actor calls fail. Wrong codes update the counter and RETURN safe JSON rather than raising an exception that would undo it. The fifth wrong code exhausts the limit; a subsequent correct code still fails. Regeneration permits another attempt sequence. Successful verification increments the attempt counter in line with Delivery semantics, marks verification, atomically updates order/job to pickup_confirmed, records one pickup event and notifies Farmer and Buyer.

Pickup never updates physical inventory. Acceptance has already allocated the order quantity. The tested 100 KG batch with a 30 KG order retained exactly 70 KG and available status, including unchanged source timestamps, after pickup.

## Acceptance deadlines, expiry and notifications

Acceptance retains its existing offer → marketplace parent → batch lock order. The parent status and deadline are checked after all locks with clock_timestamp(), avoiding PostgreSQL now() remaining fixed at transaction start. Expired or elapsed-deadline parents reject with the existing AUCTION_NOT_ACCEPTABLE / LISTING_NOT_ACCEPTABLE contract. Remaining acceptance code, quantities, partial allocation, order creation and notifications are preserved.

Expiry handles open/partially_sold auctions and active/partially_sold Fixed Price listings. Only active/partially_accepted bids and pending/partially_accepted requests with unallocated remainder become expired. Fully accepted offers and their orders survive. No batch or order writes occur in expiry. Existing creation RPCs can relist unsold physical inventory.

Parent and child scans use FOR UPDATE SKIP LOCKED. A busy child skipped on one invocation is eligible for cleanup on a later invocation even if its parent is already expired. This avoids waiting for offer locks while holding a parent lock opposite to acceptance's lock order. No multi-session contention stress test was performed.

Warnings are inserted on an invocation within the final hour when both auction/physical remainder and an actionable bid remainder exist. Fully allocated bids and no-bid auctions do not warn. Expiry with auction remainder inserts an expiry notification. The partial unique index plus ON CONFLICT DO NOTHING prevents duplicates. Existing deep links are preserved: entity_type=auction, entity_key=auction ID, data.auctionId=auction ID.

Existing workspace/marketplace and listing creation paths invoke expiry. No database scheduler was found; an unmanaged external scheduler cannot be ruled out by database inspection. Exact one-hour warning delivery cannot be guaranteed without an invocation during that window. No scheduler or push infrastructure was introduced.

## Trust correction and Delivery preservation

Farmer declaration scope is each physical batch with at least one authoritative auction, fixed listing or order relationship. EXISTS prevents multiple relationships from double-counting a batch. The numerator remains farmer_declared A/B/C equally; an unlisted grade-null batch is excluded. A listed undeclared batch is included as a workflow omission. No qualifying history leaves quality_consistency_score null and preserves the existing neutral contribution.

Formula remains 70% rating contribution (default 70), 20% role reliability (default reliability 80), plus min(completed transactions,10), bounded 0–100. Buyer payment and Logistics delivery logic, completion counts and the shared formula were verified textually unchanged.

Both `demo_generate_delivery_otp` and `demo_verify_delivery_otp_v2` deployed definitions exactly match their captured pre-migration definitions. No delivery schema/UI, payment, tracking or final-balance code changed. Rollback tests exercised Delivery five-attempt exhaustion, regeneration and successful transition to order balance_pending / job delivered; the Pickup record remained independent. Final balance payment was not rerun live in this phase.

## Database validation actually performed

Both SQL files explicitly BEGIN, use service_role for integration assertions and always ROLLBACK. They are manual integration scripts, not migrations or part of the mocked npm suites. Random-ID fixtures and all resulting events/notifications/trust changes were rolled back. An initial Pickup test-harness CASE-expression syntax error was corrected before its successful run; it did not expose a migration failure.

| Required invariant | Measured result |
| --- | --- |
| Exact signatures / effective grants | PASS: catalog inspection of all seven functions |
| No persisted plaintext | PASS: six-digit response, three safe fields, hash equality assertion, storage schema |
| Regeneration | PASS: different code, reset attempts, old code rejected |
| Wrong attempts persist | PASS: read back counters 1–5 between calls in the transaction |
| Fifth attempt / correct-after-exhaustion | PASS: exhausted with zero remaining; correct code rejected |
| Actor and state restrictions | PASS: foreign Farmer, Buyer role, foreign/null Logistics, unpaid order/job, missing/unassigned job |
| OTP format/availability/expiry | PASS: null/malformed/missing/expired rejected |
| Atomic pickup and side effects | PASS: order/job states, verified record, one event, two notifications |
| Source remainder | PASS: full batch JSON unchanged at 70 KG available |
| Direct bypass retirement | PASS: service_role permission denied; owner stub also rejects |
| Unswept Auction / Fixed deadline | PASS: open/active and partially_sold reject after deadline passes during transaction |
| Partial expiry / offer remainder | PASS for Auction and Fixed Price |
| Accepted offers/orders survive | PASS for partial and fully accepted quantities |
| Relisting | PASS via existing auction and fixed creation RPCs using 70 KG remainder |
| Warning / expiry idempotency and deep links | PASS: repeated calls create one of each; no-bid/fully-allocated warnings absent |
| Trust scope / grades | PASS: unlisted null neutral; A/B/C equal at 100; listed null yields 50; duplicate relationship stays 50 |
| Delivery regression | PASS: five attempts, regeneration, delivery states, independent Pickup record |

Counter persistence was demonstrated across RPC calls within a transaction later rolled back, not through a committed fixture or a separate PostgREST HTTP session. Full multi-device/HTTP E2E and concurrent-client stress were not claimed.

Before/after fingerprints matched across all 12 measured sets: batches, auctions, bids, listings, requests, orders, jobs, notifications, events, payments, trust and Delivery OTP metadata (excluding its hash). The first eleven compare complete row data. No sensitive fingerprints or OTP values were printed in this report. New Pickup OTP table contains zero retained test records.

## Security advisor results after DDL

No new warning was introduced by the scoped functions.

- INFO RLS enabled/no policies: 24 tables, up from 23 because Pickup OTP follows the backend-only model. This is intentional with no anon/authenticated table privileges. [Advisor reference](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- Pre-existing WARN: public.update_updated_at has mutable search_path. Outside this scoped migration. [Remediation](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).
- Pre-existing WARN: public.handle_new_user() and public.rls_auto_enable() are SECURITY DEFINER functions executable by anon and authenticated. Their auth/DDL-trigger behavior was not changed in this business handoff. [Anon remediation](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [authenticated remediation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

These existing findings remain follow-up security work; this report does not claim a clean project-wide security audit.

## Application validation

| Command | Result |
| --- | --- |
| npm run typecheck | PASS |
| npm run test | PASS — 67/67, no skips |
| npm --prefix server run typecheck | PASS |
| npm --prefix server run build | PASS |
| npm --prefix server test | PASS — 127/127, no skips |
| npx expo export --platform android --output-dir .expo/phase-2-0-17-export | PASS — 1045 modules, 107 assets, Android Hermes bundle |
| git diff --check | PASS |

The first sandboxed mobile/server test attempts failed before tests started with Windows uv_os_get_passwd ENOMEM from tsx. Both full suites passed when rerun with approved execution outside that sandbox. No test assertions were weakened or skipped. No Node contract changes were necessary, so application tests/code were not modified.

## Exact changed files

1. `AGENTS.md` — current deployed boundaries and validation target.
2. `README.md` — current phase and deployed contract status.
3. `PROJECT_REQUIREMENTS.md` — current authorization, trust and expiry truth.
4. `DEVELOPMENT_GUIDE.md` — deployed contracts, rollback testing and timing limitations.
5. `PHASE_2_0_17.md` — this report.
6. `supabase/migrations/20260919150633_phase_2_0_17_database_handoff.sql` — applied migration.
7. `supabase/tests/phase_2_0_17_pickup_rollback.sql` — Pickup/Delivery integration assertions.
8. `supabase/tests/phase_2_0_17_marketplace_trust_rollback.sql` — expiry/deadline/trust assertions.

Historical phase reports, assets, mobile/server source, dependencies and private environments are unchanged. Export/build outputs remain ignored.

## Remaining limitations and handoff

No implementation or required-validation blocker remains. Live database integration validation was performed with rollback fixtures; no device/emulator interaction or new end-to-end retained business scenario was performed. Device verification is still a separate acceptance step. No exact wall-clock warning guarantee, external scheduler inventory or concurrent-client stress result is claimed. Pre-existing security advisor warnings remain as documented. Review the working tree before committing; no automatic commit or push was made.
