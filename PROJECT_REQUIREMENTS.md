# FarmPrism Project Requirements

## Product and source of truth

FarmPrism is an implemented agricultural marketplace prototype connecting farmers, buyers and logistics partners. Current phase: [2.0.11 — prototype finalization](PHASE_2_0_11.md). The current local Development working tree and latest explicit product decisions are authoritative. Phase files preserve historical implementation and validation records; they do not override current requirements.

The current screen-behavior/design brief is [the designer screen pack](assets/FarmPrism_Designer_Screen_MDs/INDEX.md), with [master flow](assets/FarmPrism_Designer_Screen_MDs/MASTER_FLOW.md). Preserve this pack. Approved Farmer Home and My Farm visuals remain frozen. Do not infer that every designer brief represents an implemented screen.

## Architecture and security

React Native / Expo / TypeScript → Node/Express business API → Supabase.

The mobile app uses React Navigation, typed API clients, hooks and providers. Supabase is the persisted source of truth for authentication, permanent roles, preferences and application data, the RLS boundary for real auth, and the host of existing transactional/demo RPCs. Existing mobile Supabase auth/profile reads remain supported.

Node owns demo-session authorization, marketplace orchestration, market API integration, price intelligence, simulated payments, logistics, GPS ingestion, delivery OTP, feedback/trust reads and development reset CLI integration. Atomic acceptance, inventory, claim, payment and delivery operations use the existing RPCs. Keep server and mobile dependency sets separate.

Never expose service-role keys, private keys, market/AI credentials, raw tokens or OTPs in logs, frontend code or EXPO_PUBLIC_* variables. The mobile client uses its public/publishable Supabase key, with legacy anon-key fallback. Demo tokens use the existing SecureStore/provider lifecycle; do not invent additional manual token/password storage. The server matches SHA-256 token hashes and checks expiry, revocation and enabled account state.

Do not change Supabase schema, migrations, RLS or existing database functions in this phase. Do not recreate the externally completed trust/reset functions. No commit, push, branch change, reset, revert, stash or Git history manipulation.

## Roles and authentication

Exactly three persisted roles: farmer, buyer, logistics. One login has one permanent application role. There is no authenticated role switcher. To change account/role, sign out and sign in. FPO is Coming Soon UI only, not a persisted role or Buyer subtype.

Development mock OTP uses EXPO_PUBLIC_MOCK_OTP=true and accepts any six-digit numeric OTP for the nine fixed demo accounts. Server-issued demo sessions and the mobile SecureStore session flow are implemented. Logout revokes the session; reusing a revoked token returns 401. Real SMS OTP is future scope.

| Login | Phone | Name |
| --- | --- | --- |
| farmer1 | +919000000001 | Atharva Kharat |
| farmer2 | +919000000002 | Farmer Two |
| farmer3 | +919000000003 | Farmer Three |
| buyer1 | +919000000011 | Demo Restaurant Buyer |
| buyer2 | +919000000012 | Demo Wholesaler Buyer |
| buyer3 | +919000000013 | Demo Buyer Three |
| logistics1 | +919000000021 | Logistics One |
| logistics2 | +919000000022 | Logistics Two |
| logistics3 | +919000000023 | Logistics Three |

## Crops and units

Only Tomato, Onion and Potato are supported. Do not add Other Crop. Store quantities in KG and prices in INR/KG. Display 100 KG = 1 Quintal; Farmer market and price insight use INR/Quintal as the primary unit.

## Implemented Farmer experience

Home, My Farm, Sell, Insights, Profile, Notifications and secondary selling/transaction screens are implemented. Navigation: Home / My Farm / Sell / Insights / Profile. Approved Home and My Farm must remain visually unchanged.

Home owns daily summary, Top Opportunity, market reference, active auctions, new offers, sold this month and quick actions. Top Opportunity is the strongest active auction bid; fixed-price requests remain separate. Trust Score must remain absent from Farmer Home.

My Farm means “What I have”: Total Land, Crops, Available to Sell and Active Batches; crop cards show status, available quantity and batch count. Do not restore Soil Health, Irrigation, crop-wise cultivated area, Expected Yield, Harvest Date, Farm Photos or the bottom branding banner. Secondary screen implementation must be verified in code against the designer pack rather than assumed from a brief.

## Selling and quality

Common flow: Physical Batch → Farmer Declared Quality → Market / Price Insight → Choose Selling Method.

Quality is Farmer Declared A/B/C, never certified or AI Verified. The current prototype needs no camera, gallery upload, video or visual AI. A genuine camera/video-assisted quality pipeline is future scope.

Auction and Fixed Price are implemented, including partial quantities.

Auction duration is 6, 12 or 24 hours, default 24. Buyers propose quantity, price and Farmer advance of 10–90%; they can revise or withdraw active bids before acceptance. Previous bids remain historical and only the latest is current. Farmers may accept any suitable eligible bid, partially or fully, reject bids, or close early. An auction can create multiple orders. No automatic highest-bid winner or auto-award on expiry: the farmer decides whether to accept eligible existing bids, and backend rules govern unaccepted quantity.

Fixed Price uses the Farmer's locked price and 24-hour expiry unless sold or closed earlier. Buyer cannot negotiate price; a purchase request proposes quantity and 10–90% Farmer advance. Farmer accepts or rejects. Partial purchases preserve eligible remaining quantity. Purchase requests are distinct from auction bids.

## Government market data and price intelligence

Node integrates data.gov.in / AGMARKNET daily mandi observations. Configuration belongs only in server/.env: MARKET_PROVIDER=data_gov, MARKET_API_BASE_URL, MARKET_API_KEY, MARKET_RESOURCE_ID, MARKET_API_LIMIT and MARKET_API_TIMEOUT_MS. Defaults are HTTPS https://api.data.gov.in/resource, limit 100 and timeout 10000 ms; there is no default resource ID. DATA_GOV_IN_API_KEY is deprecated key fallback only when the canonical key is blank/missing. Missing key/resource skips official fetch and retains DB observations. Invalid provider/configuration fails with safe configuration errors.

Normalize min/max/modal from INR/Quintal to INR/KG. Reject invalid dates, non-positive prices and min > modal or modal > max. Preserve Maharashtra and optional district filtering. A valid official result must survive DB read/cache-write outages; an official outage uses DB fallback honestly. Official points have source data.gov.in / AGMARKNET and isDemo=false. Prototype observations retain isDemo=true. Current-observation provenance is distinct from historical demo inputs.

Farmer Price Insight remains limited to Current Market Price, Min, Max, Suggested Selling Price and Next 7 Days. Do not display raw 30/60/90 history, confidence, volatility, moving averages, buyer-signal counts, full statistical reasoning, fallback terminology or API diagnostics. One subtle source label may say Market data: AGMARKNET when the current observation is official, or Demo market data for demo observations. Configuration presence alone never establishes official provenance.

Market history and objective statistics remain internal and dominant. Calculate market trend/momentum first, apply a deterministic contextual modifier to the recommendation center, then retain volatility-based range width:

| Input | Adjustment |
| --- | --- |
| Grade A / B / C / null | +1.5% / 0% / -1.5% / 0% |
| High / moderate / low demand | +1.5% / +0.5% / 0% |
| Quantity <500 / 500–999.99 / >=1000 KG | 0% / -0.5% / -1% |

Clamp the total to -3%…+3%. Demand classification uses existing active signals: high >10, moderate >2, otherwise low. Prices must remain positive. This is a prototype statistical/contextual policy, not a trained AI model or a sale/price guarantee. Do not invent factors without data.

AI_PROVIDER_API_KEY, AI_PROVIDER_MODEL and AI_PROVIDER_ENDPOINT remain optional for the existing explanation gateway contract. No vendor payload is invented. The optional explanation cannot alter numeric recommendations; absent or failing AI leaves the statistical/contextual result usable.

## Buyer, orders and simulated payments

Buyer Home, Market, My Bids/Requests, Orders, Profile, notifications and transaction details are implemented. Navigation: Home / Market / My Bids / Orders / Profile. Counterpart profiles may show backend trust. Buyer saved delivery details remain scoped to the authenticated Buyer.

Accepted bids/requests create authoritative orders containing Farmer, Buyer, batch, source, allocated quantity, unit price, total, accepted advance and payment/logistics/delivery status.

Implemented flow: Order → Buyer pays accepted Farmer advance (10–90%) → logistics job → agreed fee → Buyer pays logistics 40% advance → pickup → tracking → delivery OTP verified → Buyer pays Farmer balance and logistics 60% balance → completed order/job → feedback and trust update.

Payments are simulated prototype records, not real gateway transactions. Only the Buyer pays logistics; Farmer may view its status/fee. Platform logistics fee is ₹0 and Logistics receives 100% of the agreed fee.

## Logistics and delivery

Navigation: Home / Jobs / Active / History / Profile. Available jobs, eligibility/capacity, first-eligible atomic claim, fee proposal/acceptance, pickup, actual device GPS via Expo Location, development simulated GPS, delivery OTP, history and profile are implemented. A second logistics actor cannot claim an assigned job. Expose only appropriate operational profile information.

Clearly distinguish simulated tracking from actual device GPS. Farmer/Buyer may view progress without unnecessary precise location disclosure. Backend generates delivery OTP; Buyer sees and tells Logistics; Logistics enters and verifies it. Successful verification itself confirms delivery. Do not add a redundant second Confirm Delivery step.

## Feedback, trust, notifications and refresh

Feedback and backend-controlled Trust Score (0–100 with completion/rating context) are implemented. Feedback is order-linked after completion. Trust is not directly editable. Farmer quality consistency means consistency of declaring produce quality for listed produce. It does not mean percentage of Grade A/B produce. Grade C alone is not untrustworthy and must not reduce Farmer Trust. The externally corrected demo_recalculate_trust function must not be modified.

Buyer trust reflects feedback, payment and transaction reliability; Logistics trust reflects feedback, delivery and job reliability. Trust remains off Farmer Home and available on relevant profiles.

Notifications cover bids/revisions/withdrawals, requests, acceptance, orders, payments, assignment/fees, pickup/tracking, OTP/delivery, balances and feedback. Deep-links resolve to canonical destinations. Existing focus/periodic refresh and cached-data error behavior are implemented. Realtime may supplement authorized backend reads where appropriate; it must never replace validation.

## Development reset and future scope

The server-only CLI wraps the existing service-role-only demo_reset_prototype_data() RPC. It refuses production and requires exactly RESET_FARMPRISM_DEMO. It accepts no arbitrary SQL, table or RPC name. No reset mobile UI or HTTP endpoint is added. It prints only whitelisted safe RPC summary fields. The existing RPC clears demo runtime/session/transaction state and restores its defined inventory, marketplace and trust scenario while preserving static accounts/profiles/mandi data. Do not automatically run it: preserve completed E2E evidence until the developer deliberately resets.

Disputes are backend foundation only, with no dispute UI. Blockchain is completely future: no fake hashes or chain records. Production SMS, real payment gateway, government Farmer-ID API, FPO implementation, genuine camera/video AI quality, production maps/routing and cloud/security hardening remain future scope.

## Quality and validation

Keep strict TypeScript, service/provider/hook/navigation boundaries, separate server/mobile dependencies and the approved visual freeze. Inspect existing code before adding features. Do not manufacture runtime business data or rebuild proven transaction logic. Use mocked dependencies in tests; no live reset or government-data dependency in automated tests.

Required validation: root typecheck and mobile tests; server typecheck, build and tests; Android Expo export; git diff --check. See DEVELOPMENT_GUIDE.md for commands. No commit or push.
