# Phase 2.0.4 mutation API

The current server implements all 22 requested POST routes in
`src/routes/mutation.routes.ts`. Each route uses the persisted demo session's
account ID and role. Strict body allowlists reject actor IDs, negotiated
fixed-listing prices, and client-supplied payment amounts or percentages.

`src/services/mutation.service.ts` validates requests and projects typed RPC
responses. `src/repositories/mutation.repository.ts` invokes the existing
service-role-only functions. One command calls one atomic mutation RPC.
Acceptance additionally reads the created order's contract; that read does
not update inventory or create another order.

All payment responses include `simulated: true`; no money moves. Capacity,
first-successful logistics claims, payment prerequisites, fee rejection and
reproposal, delivery confirmation, and completion remain database decisions.
Tracking explicitly carries `actual` or `simulated`.

Only the buyer delivery-OTP endpoint returns the OTP. Mutation responses use
field allowlists and no-store caching. Errors and logs do not expose database
messages or OTPs. The existing order detail endpoint now checks participants.
There is no additional delivery-confirmation endpoint or dispute screen.

Marketplace reads invoke `demo_expire_marketplace`. Farmer ownership follows
inventory batches; bids and requests are joined through their selling resource.
Logistics capacity and order ownership follow jobs and orders. Account/profile
reads load the current `demo_trust_scores` row. Feedback and final-payment RPCs
already call `demo_recalculate_trust`; Node and React Native do not calculate it.

The mobile `src/services/api/mutation.client.ts` methods and
`mutation.types.ts` mirror these contracts. No screen, hook, auth provider, or
navigation changes wire them into Farmer Home or My Farm.

## Verification and existing database limitation

Function signatures, return fields, exception codes, and relevant columns were
inspected with read-only catalog queries on the existing FarmPrism project.
No SQL mutation, migration, or schema change was executed. Route/service tests
mock Supabase, including persisted-session lookups, and do not mutate real data.
These tests verify API orchestration, not live database transactions.

The existing `demo_verify_delivery_otp` increments `attempt_count` and then
raises `INVALID_OTP` on a wrong code. PostgreSQL rolls back that increment with
the exception. Consequently repeated incorrect attempts do not accumulate as
intended. The API maps `OTP_ATTEMPTS_EXCEEDED` to 409 when returned, but cannot
repair the underlying attempt limit without an approved database change.
No workaround transaction logic or local attempt counter was introduced.

The server requires its existing private environment configuration for live
execution. No credentials were added. Live mutation smoke tests were not run.
