# FarmPrism Phase 2.0.7

## Backend gaps resolved

Phase 2.0.7 wires the externally provisioned Supabase RPCs into the Node API and the existing temporary trading screens. No Supabase schema, migration, or RLS changes were made.

- Farmer Declared quality editing now supports grades A, B, and C, with optional notes.
- Auction bid rejection is available to the owning farmer.
- Fixed-price purchase-request rejection is available to the owning farmer.
- Delivery OTP verification now uses `demo_verify_delivery_otp_v2`.
- Failed delivery OTP attempts retain their backend attempt count and remaining-attempt metadata.
- Buyer delivery OTP regeneration clears the displayed old OTP before requesting a new one.

The old `demo_verify_delivery_otp` RPC remains unused at runtime. The v2 service never exposes OTP hashes or logs OTP values.

## UI behavior

The existing Farmer Sell quality screen keeps the exact `Farmer Declared Quality` label and routes to Price Insight after a successful save or when no quality change is needed. Listed-batch conflicts refresh the workspace and show a friendly message.

Offer Details supports both `Accept Offer` / `Reject Offer` and `Accept Request` / `Reject Request`, with confirmation before rejection. Partial and full acceptance remain available.

Logistics displays `Incorrect delivery OTP` with the server-provided attempts remaining. Exhausted attempts instruct the user to ask the buyer for a new OTP. Delivery is only marked by the backend after successful verification.

## Validation

Run from the repository root:

```powershell
npm run typecheck
npm run test:mobile
npx expo export --platform android --output-dir .expo/phase-2-0-7-export
```

Run from `server/`:

```powershell
npm run typecheck
npm run build
npm test
```

Finally:

```powershell
git diff --check
```

Automated tests do not perform real Supabase mutations.
