# FarmPrism Project Requirements

## 1. Product Goal
FarmPrism is a mobile agricultural marketplace designed to connect farmers, buyers, and logistics partners in a trusted supply chain. The current prototype focuses on the mobile app foundation, real authentication and role flow, approved Farmer Home and My Farm screens, and the architecture needed for later marketplace trading, orders, delivery coordination, and AI market guidance.

## 2. Source of Truth / Latest Decisions
These requirements are the source of truth for implementation and documentation:

- FarmPrism Detailed Walkthrough Architecture v5
- latest explicit project decisions captured in this repository

Older README notes, screenshots, stale workflow docs, and earlier product assumptions are visual references only and do not override newer explicit requirements.

## 3. Current Application Architecture

### Mobile
- React Native
- Expo
- TypeScript
- React Navigation

### Backend
- Supabase as the persisted database and RLS boundary
- Node.js / Express / TypeScript API for business and external integration logic

Supabase remains responsible for:
- database persistence
- RLS boundaries for real authenticated users
- realtime when useful
- storage for later use

The Node/Express business layer owns logic such as:
- demo mutation authorization
- AGMARKNET / data.gov.in adapter
- AI price recommendation orchestration
- auction commands
- fixed-price commands
- bid validation
- atomic transaction coordination
- payments
- logistics assignment
- GPS ingestion
- delivery OTP verification
- trust-score computation
- demo reset
- future external integrations

Blockchain is not part of the current implementation.

## 4. Roles and Permissions
FarmPrism has exactly three persisted application roles:

- farmer
- buyer
- logistics

Rules:
- one login = one permanent role
- a user does not have multiple application roles
- there is no authenticated role switcher
- changing role/account requires sign out and another login
- FPO is a Role Selection tile only and is marked as Coming Soon
- FPO is not a persisted fourth role
- FPO is not a buyer subtype
- FPO is not added to the database enum

Stale documentation that allows multiple application roles must be removed.

## 5. Authentication
The current prototype uses mock OTP development mode:

- `EXPO_PUBLIC_MOCK_OTP=true`
- any six-digit OTP is accepted

There are nine fixed demo accounts:

- farmer1 / +919000000001 / Atharva Kharat
- farmer2 / +919000000002 / Farmer Two
- farmer3 / +919000000003 / Farmer Three
- buyer1 / +919000000011 / Demo Restaurant Buyer
- buyer2 / +919000000012 / Demo Wholesaler Buyer
- buyer3 / +919000000013 / Demo Buyer Three
- logistics1 / +919000000021 / Logistics One
- logistics2 / +919000000022 / Logistics Two
- logistics3 / +919000000023 / Logistics Three

These are prototype account fixtures. A server-issued demo session token will be added later for mutation authorization. The token is internal and invisible to users. Real Supabase SMS OTP remains future/production scope.

## 6. Mobile Security Boundary
The mobile app uses only the public or publishable Supabase key. The server-side API may use service-role and external API credentials when required. Those secrets are never sent to React Native, stored in `EXPO_PUBLIC_*` variables, or logged.

## 7. Crops and Quantities
The prototype marketplace supports exactly these crops:

- Tomato
- Onion
- Potato

No additional crop such as Other Crop is part of the current prototype.

All quantities are stored internally in KG. UI display uses the convention: 100 KG = 1 Quintal.

## 8. Farmer Home
The approved Farmer Home screen is frozen and must not be redesigned.

The Farmer Home owns:
- daily summary
- Top Opportunity
- market reference
- active auctions
- new offers
- sold this month
- quick actions
- notifications

Important rules:
- Top Opportunity refers to the strongest active auction bid only
- fixed-price purchase requests are separate from auction opportunities
- there is no Trust Score on Farmer Home

## 9. My Farm
My Farm means “What I have.” The existing root implementation is approved and should remain working.

Current My Farm overview includes:
- Total Land
- Crops
- Available to Sell
- Active Batches

Current crop cards include:
- Status
- Available Quantity
- Batch Count

Removed from the current My Farm scope:
- Soil Health
- Irrigation
- Crop-wise cultivated area
- Expected Yield
- Harvest Date
- Farm Photos
- bottom branding banner

Secondary My Farm destinations remain future work.

## 10. Selling Methods
FarmPrism supports exactly two selling methods:

A. Auction
B. Fixed Price

Common flow:
- Physical Batch
- Quality
- Market / AI Price Insight
- Choose Selling Method

### Auction Rules
Farmer chooses one of:
- 6 hours
- 12 hours
- 24 hours

24 hours is the default.

Buyer can:
- bid for partial quantity
- propose price
- propose Farmer advance percentage
- revise a bid
- withdraw an active bid before acceptance

Advance must be within 10%–90%.

Previous buyer bids remain historical; only the latest bid is current and active.

Farmer can:
- accept any appropriate buyer bid
- accept partial quantity
- accept full quantity
- reject
- close the auction early

One auction may generate multiple orders. The farmer does not have to choose the highest bid.

When an auction expires:
- do not auto-award
- the farmer decides whether to accept eligible existing bids
- unaccepted quantity becomes available or re-auctionable per backend rules

### Fixed Price Rules
Farmer chooses a fixed selling price.

A listing is active until sold, manually closed, or automatically expires after 24 hours.

Buyer does not negotiate the fixed price. The buyer proposes:
- quantity
- Farmer advance percentage (10%–90%)

Farmer may:
- accept
- reject

If a buyer wants a different price, they should participate via auction. Partial quantity purchases are supported; remaining quantity remains available where valid.

Fixed-price requests are not auction bids.

## 11. Quality
The current prototype quality is farmer-declared. Farmer manually selects:

- Grade A
- Grade B
- Grade C

Remove language such as AI Verified, FarmPrism Verified, or Certified unless a real verification workflow is implemented.

Current prototype does not require:
- camera capture
- video capture
- gallery upload
- AI visual quality model

Future production quality flow includes real-time camera/video capture plus AI-assisted quality assessment and scoring. That pipeline is future scope and not part of the prototype.

## 12. Market and AI Price Intelligence
The primary official market data source is Government of India open data through AGMARKNET-derived mandi data.

Node/Express owns the external API adapter and orchestration. Expected inputs may include:
- crop
- farmer location
- district/state
- nearby mandi data
- current min, max, modal price
- historical prices
- market arrivals
- price momentum
- volatility
- seasonality
- FarmPrism buyer demand
- active marketplace demand
- quantity
- Farmer-declared quality grade

Historical views:
- 30 day
- 60 day
- 90 day

Recommendation horizon:
- next 7 days

Outputs may include:
- current market context
- suggested selling range
- suggested reserve price
- confidence
- plain-language reasoning

The system must not promise a guaranteed future selling price. Statistical analysis must calculate objective trend signals before the AI layer interprets them. Do not hardcode fake price recommendations directly in JSX.

## 13. Buyer Scope
The buyer experience is planned to include:
- Buyer Home
- Market
- Active Auctions
- Fixed Price Listings
- Auction Details
- Fixed Price Details
- Farmer Profile
- Quality information
- Market context
- Place Bid
- Revise Bid
- Withdraw Bid
- My Bids
- Purchase Requests
- Orders
- Payments
- Logistics tracking
- Notifications
- Profile
- Trust Score

The temporary visual design should follow the existing FarmPrism visual language of green, cream, earthy tones, rounded cards, and subtle shadows. This is not final visual design.

Suggested temporary buyer bottom nav:
- Home
- Market
- My Bids
- Orders
- Profile

## 14. Orders
Accepted auction bids or accepted fixed-price requests create an Order.

An Order contains authoritative values for:
- Farmer
- Buyer
- Batch
- Selling source
- Quantity
- Unit price
- Total amount
- Advance %
- Payment status
- Logistics status
- Delivery status

Advance terms from the accepted buyer proposal become part of the order contract.

## 15. Payment Flow
Prototype payments are simulated, not real gateway transactions.

Buyer and farmer mutually decide the advance percentage through the buyer proposal and farmer acceptance. The allowed range is 10%–90%.

Flow:
1. Order Created
2. Buyer pays Farmer Advance
3. Logistics arranged
4. Buyer accepts logistics fee
5. Buyer pays Logistics 40% advance
6. Pickup
7. In Transit
8. Delivery
9. Delivery OTP verified
10. Buyer pays remaining Farmer balance
11. Buyer pays remaining 60% Logistics balance
12. Order Completed

Pay actions create simulated success records after confirmation, but they do not involve a real gateway.

## 16. Logistics
The logistics flow is planned for three demo logistics accounts and eventual full usability. The temporary navigation model is:
- Home
- Jobs
- Active
- History
- Profile

Logistics supports:
- profile
- verification
- vehicle details
- capacity
- available jobs
- job details
- job acceptance
- active job
- pickup
- GPS tracking
- delivery
- history
- Trust Score

Available jobs are visible to eligible logistics users. The first eligible logistics partner to accept a job gets it. Assignment must be atomic at the backend; other logistics partners must not be able to claim the same job.

## 17. Logistics Fee and Visibility
Logistics proposes fee. Buyer pays the logistics fee after accepting the proposal.

Payment split:
- 40% advance
- 60% after successful delivery

Platform fee: ₹0

Logistics receives 100% of the agreed logistics fee.

Farmers may view logistics fee and status, but only the buyer pays the fee.

Assigned logistics profiles are visible to Farmer and Buyer and may include appropriate operational details. Sensitive information must not be exposed unnecessarily.

## 18. GPS and Delivery OTP
GPS support includes:
- actual device GPS through Expo Location
- development-only simulated GPS fallback

The app must clearly distinguish simulated tracking from actual device location. Farmers and buyers may view delivery progress.

Delivery confirmation uses OTP.

Flow:
1. backend generates OTP
2. buyer receives/sees OTP
3. buyer tells logistics partner
4. logistics enters OTP
5. backend verifies OTP
6. delivery is confirmed

Successful OTP verification is the buyer’s delivery confirmation. It should not require a second redundant “Confirm Delivery” button.

## 19. Feedback and Trust Score
Trust Score is in current prototype scope and is visible where relevant.

Recommended format:
- Trust Score: 0–100
- completed transaction count / rating context

Farmer Trust can use:
- buyer feedback
- quality consistency
- successful completed orders
- transaction reliability

Buyer Trust can use:
- farmer/logistics feedback
- payment reliability
- completed transactions
- cancellation behavior

Logistics Trust can use:
- farmer/buyer feedback
- successful deliveries
- delivery reliability
- job completion behavior

Ratings are submitted after completed transactions, and backend-calculated trust is not directly editable by users.

Do not restore Farmer Trust Score to Farmer Home.

## 20. Disputes
Dispute support is currently backend foundation only. No dispute UI is implemented in this phase. Architecture may support order-linked dispute records with fields such as raised_by, against, reason, description, evidence reference, and status.

## 21. Notifications
Events to support include:
- New Bid
- Bid Revised
- Bid Withdrawn
- Purchase Request
- Bid/Request Accepted
- Order Created
- Farmer Advance Paid
- Logistics Job Available
- Logistics Assigned
- Logistics Fee Proposed
- Logistics Fee Accepted
- Logistics Advance Paid
- Pickup
- In Transit
- Delivery OTP
- Delivered
- Balance Paid
- Feedback Reminder

Notifications should deep-link to canonical screens and destinations.

## 22. Realtime
Supabase Realtime should be used where appropriate for:
- bids
- purchase requests
- auction/listing state
- orders
- logistics assignment
- GPS updates
- notifications

Realtime supplements backend authorization; it does not replace backend validation.

## 23. Demo Reset
The current prototype includes a development-only reset mechanism. It restores the complete SIH/demo starting scenario including:
- nine accounts
- farm data
- produce
- batches
- market data
- auctions
- fixed listings
- bids
- purchase requests
- orders
- payments
- logistics jobs
- notifications
- trust and feedback fixtures as appropriate

This is not a production user feature.

## 24. Future Scope
The following remain explicitly future scope and must not be implemented in the current prototype:
- real SMS OTP
- government Farmer-ID verification API
- production payment gateway
- blockchain integration
- FPO role implementation
- production camera/video AI quality model
- production visual quality certification
- dispute UI
- full production maps/routing provider
- final production AI hardening
- final cloud deployment/security hardening

## 25. Blockchain
Blockchain is completely deferred and must not be represented with fake blockchain hashes, fake verification labels, or placeholder blockchain tables used only for appearance. Blockchain integration will happen later through a proper implementation.

## 26. Node / Express Server Groundwork
Create a minimal separate server workspace at `server/` using Node.js, Express, and TypeScript.

The scaffold is intentionally minimal and suitable for future integration.

Suggested structure:
```text
server/
  package.json
  tsconfig.json
  .env.example
  src/
    app.ts
    server.ts
    config/
      env.ts
    routes/
      health.routes.ts
    middleware/
      error.middleware.ts
    types/
    services/
      README.md
```

The server must expose `GET /health` returning JSON such as:
```json
{
  "ok": true,
  "service": "farmprism-api"
}
```

Use strict TypeScript. Do not place real credentials in the repository. `.env.example` should contain only placeholders for values such as:
- PORT=
- SUPABASE_URL=
- SUPABASE_SERVICE_ROLE_KEY=
- DATA_GOV_IN_API_KEY=
- AI_PROVIDER_API_KEY=

The server-side service-role key belongs only in the Node/Express environment and must never be added to Expo or React Native code.

## 27. Security Boundary Documentation
The app uses only the mobile public/publishable Supabase key. The business API may use privileged server credentials; those secrets must never be sent to the client. Never log OTPs, session tokens, service-role keys, or external API secrets.

## 28. Mobile/Server Wiring Rule
Do not wire the React Native app to the Node server yet. Farmer Home and My Farm must continue functioning exactly as they do now. This phase only creates the server scaffold and the documentation contract.

## 29. Temporary Buyer / Logistics Status
Do not spend this phase creating a large set of temporary buyer and logistics screens. The later backend/API contract and integration phase will replace placeholder flows.

## 30. Quality and Validation Requirements
- preserve the existing Expo/React Native architecture
- inspect existing code before creating new files or feature logic
- do not invent database columns or requirements
- keep services, hooks, navigation, providers, and screens separated
- do not use fake data in final product code
- run root typecheck and server typecheck after meaningful changes
- keep documentation aligned with the actual project state

## 31. Package Management
The root mobile app keeps its own dependency set. The server has its own `package.json` and independent dependencies.

Current server dependencies should be minimal, for example:
- express
- cors (if later needed)

Dev dependencies should be minimal, for example:
- typescript
- tsx
- @types/node
- @types/express

Do not install unnecessary packages or convert the repository to a workspace unless required.

## 32. Validation Sequence
For mobile:
```powershell
npm run typecheck
```

For server:
```powershell
cd server
npm install
npm run typecheck
```

Then:
```powershell
git diff --check
```

Do not commit or push during this phase.
