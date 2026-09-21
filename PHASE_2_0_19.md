# Phase 2.0.19 — Auction Allow Partial Sale

Implemented on 2026-09-22 (Asia/Kolkata). Starting HEAD: `949e03e92c5f2905f46b3738934f8cf2c849a972`, branch `Development`, clean working tree. Latest detected phase was 2.0.18, the prototype Buyer verification Admin portal. No branch change, reset, revert, stash, commit or push. Historical reports, migrations, design briefs and private environments are unchanged.

## Product and application contract

Every Auction has an immutable `Allow Partial Sale` setting selected by the Farmer before publishing. It defaults ON. When ON, existing partial-bid/partial-acceptance behavior applies. When OFF, Buyers must bid for the complete Auction lot and the Farmer may accept only the complete lot. Buyer quantity remains visible but non-editable. Fixed Price is unaffected.

Farmer Create Auction has a native Switch beside the auction controls, default true, with the specified ON/OFF helper copy. Publishing sends an explicit boolean. No setting is offered for Fixed Price or on published details. Both Farmer and Buyer details show “Partial sale allowed” or “Full lot only”.

Buyer Place/Revise Bid retains the existing Field. OFF mode derives its displayed and submitted quantity directly from the latest item.remainingKg, disables native editing, removes the native input handler and guards the screen handler. Price, advance and delivery remain editable. Refresh updates the derived quantity; authoritative database checks reject stale/malicious requests.

Farmer Offer Details retains the original quantity flow for ON/Fixed. OFF hides the quantity editor and shortcut and shows “Accept Full Bid — X KG”, submitting the remaining auction lot automatically. Existing availability/physical quantity bounds still gate the action.

Auction-only discriminated DTOs carry required allowPartialSale:boolean. Server mapping rejects missing/nonboolean database values; mobile parsing rejects missing, null, numeric or string policy values. Fixed Price DTOs have no added property. No default-true read/parser fallback exists.

## Database and deployment

Migration name: `phase_2_0_19_auction_partial_sale`.

Repository and deployed version: `20260921193152`, file `supabase/migrations/20260921193152_phase_2_0_19_auction_partial_sale.sql`.

Supabase CLI 2.117.0 generated the initial file at 20260921192556. MCP deployment assigned version 20260921193152; the new local file was renamed to match the confirmed migration history. No historical migration was edited or replayed.

- Adds public.demo_auctions.allow_partial_sale boolean NOT NULL DEFAULT true. All four retained Auctions explicitly read true after deployment.
- Adds an invoker trigger with empty search_path that rejects changes in either direction with AUCTION_PARTIAL_SALE_IMMUTABLE. No edit endpoint/UI is introduced.
- Replaces the old five-argument create signature with one six-argument signature ending in p_allow_partial_sale boolean DEFAULT true. This avoids ambiguous overloads; old five-argument callers resolve to true. Explicit null is rejected. Node accepts omission only as documented backwards-compatible true; arbitrary nonbooleans fail validation. Current mobile input requires an explicit boolean.
- Uses inspected deployed function bodies as the baseline. After locking/loading the Auction, demo_place_or_revise_bid rejects OFF quantities distinct from the entire remaining lot with FULL_LOT_REQUIRED, before replacing any prior bid. Multiple Buyers can compete. Full-lot revision preserves replaced history and existing advance/delivery behavior.
- demo_accept_bid retains bid/Auction/batch locks, ownership, status, deadline and inventory checks. OFF acceptance must equal both auction remaining quantity and the eligible bid remainder. A rejected attempt creates no order and changes no allocation. Full acceptance produces the existing completed status and preserves the physical batch remainder.
- Bid deadline validation now uses clock_timestamp() after its lock, closing the transaction-start-time gap demonstrated by the rollback test. Acceptance already used clock_timestamp() and retains it. No scheduler, automatic award, Fixed Price RPC change, reset-function change, RLS change or unrelated grant change.
- All three changed privileged RPCs retain empty search_path and verified service_role EXECUTE, with anon/authenticated denied. The new trigger helper is not SECURITY DEFINER and has PUBLIC/anon/authenticated execution revoked.

Deploy database first, then the updated Node/mobile application. Strict auction reads require this migration. Restart/reload a running application as appropriate; an old Node process does not expose the new read contract.

## Measured validation

| Check | Result |
| --- | --- |
| npm run typecheck | PASS |
| npm run test | PASS, 74/74; no skipped tests |
| npm --prefix server run typecheck | PASS, application and scripts |
| npm --prefix server run build | PASS |
| npm --prefix server test | PASS, 131/131; no skipped tests |
| npx expo export --platform android --output-dir .expo/partial-sale-toggle-validation | PASS, 1045 modules, 107 assets, Hermes bundle |
| git diff --check | PASS |
| Migration plus fixtures inside ROLLBACK before deployment | PASS |
| Same fixture suite against deployed migration, ending ROLLBACK | PASS |
| Existing four Auctions default ON | PASS |
| Privileged RPC ACL/search_path inspection | PASS |
| Security advisors before/after | No new findings |

The current baseline was measured, not copied from the previous report's counts. The new suite adds five mobile cases and one server case. Existing Pickup/Delivery, payment, logistics, expiry, trust, inventory, My Farm and admin tests remain present and pass.

Windows sandbox execution of tsx initially failed with uv_os_get_passwd ENOMEM; running the same tests through approved escalation passed. An intermediate UI test exposed truthiness treating an omitted policy in an older mock as OFF; the screen now tests explicit false, matching the product contract, and strict real workspace parsing still rejects omission. No tests were weakened or skipped. Initial sandbox npx attempts could not access the cache/network; cached CLI execution outside the sandbox succeeded.

The SQL file `supabase/tests/phase_2_0_19_partial_sale_rollback.sql` uses existing enabled Farmer/verified Buyers and isolated batch/listing fixtures, never a live reset or persisted seed. It passed:

1. Default ON creation through the compatible five-argument RPC; 4 KG bid and 2 KG acceptance from a 10 KG Auction; 8 KG remaining, partially_accepted bid, correct physical inventory.
2. Explicit OFF creation and null policy rejection.
3. Manipulated 5 KG bid rejected without inserting a bid.
4. Three Buyers' full-lot bids coexist on an open Auction.
5. Full-lot revision updates permitted terms, replaces the previous bid and retains its history.
6. Partial revision rejected without replacing the current bid.
7. Partial acceptance rejected with no order, Auction allocation or source-batch changes.
8. Farmer chooses a lower-priced competitor; 10 KG order, zero Auction remainder, completed Auction and correct 10 KG source remainder from a 20 KG batch.
9. Policy changes rejected in both directions after publication.
10. Completed Auction rejects further bids.
11. Deadline passing inside the transaction blocks full-lot bid and acceptance; expiry still works.
12. Fixed Price 4 KG request / 2 KG acceptance remains valid.

Safe aggregate fingerprints before deployment and after post-deployment rollback match for all retained Auctions (excluding the added column), inventory batches, bids, orders and notifications: respectively 4, 7, 6, 4 and 61 rows. No fixture persisted.

## Auction re-entry and other limitations

The starting source and inspected live demo_place_or_revise_bid only permit Auction status=open. Both Buyer details and Bid Form likewise block new bids once status=partially_sold. Phase 2.0.18 explicitly records that existing re-entry constraints remain. The rollback suite confirms this pre-existing AUCTION_NOT_OPEN result after partial acceptance. Existing eligible bid remainder remains acceptable. This phase preserves that baseline and does not claim the requested assumed re-entry feature was already implemented or newly fixed.

Partial Sale ON regression: PASS for the actual baseline partial bidding/acceptance/history/inventory behavior. OFF regression: PASS. Fixed Price regression: PASS. Desired successful re-entry after partial sale: unavailable in starting implementation and remains a separately scoped limitation.

UI behavior was exercised with component/handler tests, not a live Android device, emulator or browser interaction. Android export is build validation only. No new full delivery/payment E2E or concurrent-client stress test was performed. Existing lock order is preserved; concurrency behavior was not independently load-tested.

## Security advisors

No new findings compared with the captured pre-migration baseline:

- 24 informational RLS-enabled/no-policy demo-table findings (existing service-role-only demo access).
- One existing mutable search_path warning on public.update_updated_at.
- Two existing anon SECURITY DEFINER execute warnings: handle_new_user and rls_auto_enable.
- The same two existing authenticated SECURITY DEFINER execute warnings.

These unrelated functions were not changed. Direct post-deployment inspection confirms no client execution grant on the three feature RPCs. No private key/token/OTP or environment value was printed or changed.

Implementation used the installed Supabase skill and official [Database Functions documentation](https://supabase.com/docs/guides/database/functions). Changelog markdown retrieval was attempted but the browsing tool rejected its content type; no Supabase dependency upgrade was made.

## Exact files changed

New:

- PHASE_2_0_19.md
- supabase/migrations/20260921193152_phase_2_0_19_auction_partial_sale.sql
- supabase/tests/phase_2_0_19_partial_sale_rollback.sql

Modified:

- AGENTS.md
- README.md
- PROJECT_REQUIREMENTS.md
- DEVELOPMENT_GUIDE.md
- server/src/repositories/trading.repository.ts
- server/src/repositories/trading.repository.test.ts
- server/src/routes/mutation.routes.test.ts
- server/src/services/mutation.service.ts
- server/src/types/mutations.ts
- server/src/types/trading.ts
- server/src/utils/apiError.ts
- src/components/farmer-sell/FarmerSellUI.tsx
- src/screens/trading/BuyerLogisticsScreens.tsx
- src/screens/trading/FarmerSellScreens.tsx
- src/services/api/mutation.types.ts
- src/services/api/trading.types.ts
- src/services/api/workspace.contract.ts
- tests/trading-ui.test.ts
- tests/workspace-contract.test.ts

Build/export outputs remain ignored. No private environment, dependency, auth lifecycle, approved Home/My Farm visual, historical phase/design brief or Fixed Price business implementation changed. The working tree is left uncommitted for review.
