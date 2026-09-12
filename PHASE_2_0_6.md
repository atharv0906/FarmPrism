# Phase 2.0.6 integration

The temporary Farmer Sell and Insights stacks, Buyer and Logistics navigation,
and shared order/profile/notification screens now use session-aware Node APIs.
The approved Farmer Home and My Farm screen implementations are unchanged.
Their existing navigation intents now reach Sell, Insights, Orders and Profile.

## Run the prototype

1. Configure the existing private server environment in `server/.env` using
   `server/.env.example`: Supabase URL and service-role key are required.
2. Configure `EXPO_PUBLIC_API_URL` in the mobile development environment.
   Android emulator: `http://10.0.2.2:3000`. Physical Android device: use the
   development computer's reachable LAN address and allow the development
   server port through the local firewall.
3. Keep `EXPO_PUBLIC_MOCK_OTP=true` and existing Supabase public credentials.
4. Start the API with `npm run dev` from `server/`, and restart Expo.
   Rebuild the development client after adding the Expo Location module.
5. Sign in with any of the nine existing demo phone numbers and any six-digit
   numeric OTP. Account roles still come from the persisted account.

No real keys were written during implementation. The checked local configuration
does not yet provide a mobile API URL or a server .env, so live device testing
requires that setup. No actual Supabase marketplace mutations were run.

## API and authority

- Existing Phase 2.0.4 mutations remain the only marketplace transaction commands.
- `GET /api/workspace` returns typed, role-scoped resources, participant profiles,
  notifications, order timelines, payments and tracking.
- `GET /api/market/:crop/current` and `/history?days=30|60|90` use the market
  service. Unsupported crops are rejected.
- `POST /api/farmer/price-insight` accepts only `batchId`; ownership is checked
  using the session, and demand counts come from existing bids and requests.
- `POST /api/notifications/:id/read` derives the account phone from the session
  and calls the existing notification-read RPC.
- Unassigned logistics partners see eligible job summaries, not private payment
  records or the order contract. Assignment remains first-successful-claim wins.
- Focus refresh, mutation refresh, and a 20-second foreground-screen refresh
  keep state current. The client never decrements inventory or marks delivery,
  payment or order completion locally.
- Payment actions require confirmation and explicitly say simulated.
- A server 401 clears the current session. Network errors and 409 conflicts
  retain the session; conflicts refresh data.

## Market intelligence

The provider uses the user-specified Government of India resource:
[Current Daily Price of Various Commodities from Various Markets (Mandi)](https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi).
The resource endpoint is
`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`.
The live resource could not be verified with a configured key in this run.
The adapter is covered with contract fixtures, including INR/Quintal to INR/KG
conversion and invalid-record rejection.

Government records are validated, cached in server memory for 15 minutes and
best-effort upserted into existing mandi_prices columns. A deterministic
primary key identifies each crop/market/date observation; no new index or column
is introduced. Cache-write failures do not discard usable official data.
During outage or missing key, existing `mandi_prices` observations remain usable.
Dates and provenance are retained; prototype records are labelled as fallback.
Historical windows are relative to the latest available observation, so an
older seed remains inspectable and its age stays visible. The view shows the
latest 30 individual observations from the selected window.

Recommendations use daily averages, seven-observation and thirty-day averages,
bounded momentum, volatility, market spread and observed demand. Grade and
quantity are included without inventing an unsupported quality-price premium.
Sparse, old or prototype observations lower confidence. Results are recommendations,
not guaranteed prices.

Without AI configuration, mode is `statistical_fallback`. The optional
`PriceInsightAiProvider` interface accepts structured features and returns
an explanation. A vendor-neutral HTTPS gateway can be configured with
`AI_PROVIDER_ENDPOINT`, `AI_PROVIDER_MODEL` and `AI_PROVIDER_API_KEY`.
Its protocol is POST `{ model, input }`, Bearer authentication, response
`{ reasoning: string }`. It cannot change numeric recommendations.
Invalid responses, secret echoes, claims of verification/guarantees and provider
outages retain the statistical result. No vendor SDK or vendor-specific endpoint
is assumed.

## Known limitations

- No quality-write or offer/request rejection RPC exists. Seeded Farmer Declared
  grades can be reviewed and used; editing/rejection remains deferred.
- Existing `demo_verify_delivery_otp` still increments the incorrect-attempt
  count and then raises an exception, rolling the increment back. The API
  handles its error codes, but the database attempt limit requires an approved
  database fix. No schema/RPC changes were made.
- No recommendation table is currently used by local application code; this
  phase does not introduce recommendation persistence. Government-price caching
  uses the existing mandi_prices table and no schema changes.
- The prototype read aggregator fails explicitly at 1,000 rows per source table
  rather than silently truncating. Larger deployments need scoped pagination.
- Tracking is foreground, user-triggered actual device GPS, or explicitly
  simulated coordinates in development. No background tracking or maps provider.
- Government/AI live credentials and physical-device transaction execution were
  not available. Export and mocked tests do not prove live database transactions.

## Manual demo checklist

- Farmer1 (+919000000001): Home → My Farm → Sell → Select Batch → Farmer Declared
  Quality → Price Insight → Auction/Fixed Price → Publish → Details.
- Buyer1 (+919000000011): Market → Listing → bid/request with 10–90% advance →
  My Bids → revise/withdraw as allowed.
- Farmer1: Buyer Offers/Purchase Requests → Buyer Trust → choose partial/full
  quantity → Accept → created order code and terms.
- Buyer1: Order → simulated Farmer advance.
- Logistics1 (+919000000021): Jobs → Claim → propose fee. Another logistics
  account must receive a conflict after the first successful claim.
- Buyer1: accept/reject fee → simulated 40% logistics advance.
- Logistics1: Pickup → actual/development-simulated tracking.
- Buyer1: Order → Generate Delivery OTP. Logistics1 enters it to verify delivery.
- Buyer1: simulated final Farmer and 60% logistics balances → completed order.
- Each participant: completed Order → Feedback → inspect refreshed Profile Trust.
- All roles: Notifications → related resource or canonical parent.

## Validation commands

`npm run typecheck`

`npm run test:mobile` (uses the existing server TypeScript/tsx tools)

`npx expo export --platform android --output-dir .expo/phase-2-0-6-export`

From server: `npm install`, `npm run typecheck`, `npm run build`, `npm test`.

`git diff --check`
