# FarmPrism Phase 2.0.11 — Prototype Finalization After Full Live E2E PASS

## TASK SIZE
LARGE, but tightly scoped.

Use Codex for this phase because it crosses:
- demo-session cleanup
- server environment/config parsing
- Government market integration
- price-intelligence behavior
- safe demo-reset tooling
- server tests
- project documentation

Do NOT perform another broad feature build. The core marketplace already passed live end-to-end testing.

---

# 0. SOURCE OF TRUTH

Work on the CURRENT LOCAL `Development` working tree.

The current local working tree is the source of truth.

Latest pushed `Development` checkpoint verified before this prompt:

`903f81067b478a6935ff068abd3f40571e38a509`

Commit message:
`SOME TEST and uploaded the AGMARKET API`

Important inspection result:
that push did NOT change marketplace/server business code. It:
- modified root `.env.example`
- added the designer screen specification pack under `assets/FarmPrism_Designer_Screen_MDs/`
- added the designer ZIP

The functional application code is therefore still the Phase 2.0.10 implementation plus local ignored environment values.

Do NOT assume market secrets were committed. `server/.env` is intentionally ignored.

DO NOT:
- reset
- revert
- checkout
- stash
- create another branch
- commit
- push
- rewrite Git history
- modify Supabase schema
- create SQL migrations
- change RLS
- recreate already-existing database RPCs
- expose or print API keys
- expose or print service-role keys
- expose or print raw session tokens
- change the approved Farmer Home visual design
- change the approved Farmer My Farm visual design
- implement blockchain
- implement production SMS
- implement a real payment gateway
- implement production camera/video AI quality
- invent additional crops or roles

---

# 1. READ EVERYTHING RELEVANT BEFORE EDITING

Read in this order:

1. `PROJECT_REQUIREMENTS.md`
2. `DEVELOPMENT_GUIDE.md`
3. `AGENTS.md`
4. `README.md`
5. `PHASE_2_0_10.md`
6. `assets/FarmPrism_Designer_Screen_MDs/INDEX.md`
7. `assets/FarmPrism_Designer_Screen_MDs/MASTER_FLOW.md`

Then inspect:

## Root/mobile
- `.env.example`
- `.gitignore`
- `package.json`
- `src/config/env.ts`
- `src/app/providers/AuthProvider.tsx`
- `src/services/api/`
- `src/hooks/useTrading.ts`
- `src/screens/trading/`
- `src/components/farmprism-shell/`
- `src/components/farmer-sell/`

## Server
- `server/.env.example`
- `server/package.json`
- `server/src/config/env.ts`
- `server/src/app.ts`
- `server/src/routes/demo.routes.ts`
- `server/src/routes/integration.routes.ts`
- `server/src/routes/mutation.routes.ts`
- `server/src/lib/demoStore.ts`
- `server/src/repositories/demo.repository.ts`
- `server/src/repositories/demo.repository.test.ts`
- `server/src/repositories/market.repository.ts`
- `server/src/repositories/mutation.repository.ts`
- `server/src/services/market.service.ts`
- `server/src/services/market.service.test.ts`
- `server/src/services/priceAi.provider.ts`
- current server tests/scripts

Search the whole repository for:
- `.eq('revoked_at', null)`
- `DATA_GOV_IN_API_KEY`
- `9ef84268-d588-465a-a308-a864a43d0070`
- `api.data.gov.in/resource`
- `limit', '1000'`
- `AbortSignal.timeout(7000)`
- `demo_reset_prototype_data`
- stale statements saying Node is only a scaffold/future
- stale statements saying Buyer/Logistics are not implemented

Do not edit until this read/search pass is complete.

---

# 2. VERIFIED LIVE E2E RESULT — DO NOT REBUILD WHAT ALREADY PASSED

A full live demo smoke test has now been completed using the existing nine demo accounts.

## Auction path — PASS

Passed live:
- Farmer quality save
- price insight
- auction publish
- Buyer bid
- Buyer bid revision
- Farmer acceptance
- Order creation
- Buyer Farmer-advance payment
- Logistics first-claim
- Logistics fee proposal
- Buyer fee acceptance
- 40% Logistics advance
- pickup
- tracking
- delivery OTP
- Farmer final balance
- Logistics final 60%
- Order completed
- Logistics job completed
- feedback
- notifications
- Trust Score
- inventory reconciliation

Completed Auction order:
`FP-11332B8B3E`

Inventory:
`250 KG → 240 KG`

## Fixed Price path — PASS

Passed live:
- Farmer quality save
- price insight
- fixed listing
- Buyer purchase request
- Farmer acceptance
- Order creation
- simulated advance payments
- Logistics claim
- fee flow
- pickup
- tracking
- delivery OTP
- final balances
- completion
- feedback
- notifications
- Trust Score
- inventory reconciliation

Completed Fixed Price order:
`FP-25A03D7831`

Inventory:
`100 KG → 90 KG`

## Only live failure

`POST /api/demo/logout`

returned HTTP 500 for all three actors.

Database error:
`22007 invalid timestamp "null"`

Known cause:
the active revoke query uses:

```ts
.eq('revoked_at', null)
```

No broad transaction logic change is required.

Treat Auction + Fixed Price business logic as FROZEN unless a new regression test proves a defect.

---

# 3. IMPORTANT DUPLICATION FOUND IN CURRENT CODE

There are currently TWO demo-session persistence implementations:

- `server/src/lib/demoStore.ts`
- `server/src/repositories/demo.repository.ts`

Both currently contain a revoke implementation using:

```ts
.eq('revoked_at', null)
```

The active `/api/demo/logout` route imports `revokeDemoSessionByToken` from:

`server/src/lib/demoStore.ts`

Therefore fixing only `demo.repository.ts` is NOT sufficient.

For this phase:

- fix the active `demoStore.ts` path
- also fix the duplicate repository implementation so the bug cannot remain dormant
- do NOT perform a risky broad refactor of all demo-store code

If a very small safe consolidation is obvious and tests prove it, it is allowed.
Otherwise simply keep both implementations behaviorally aligned.

---

# 4. FIX LOGOUT CORRECTLY

Replace the invalid Supabase null comparison:

```ts
.eq('revoked_at', null)
```

with:

```ts
.is('revoked_at', null)
```

wherever session revocation is implemented.

Expected live behavior:

1. Create demo session.
2. Authenticated request works.
3. `POST /api/demo/logout` returns success.
4. The row receives a non-null `revoked_at`.
5. The same token can no longer access an authenticated endpoint.

Do not:
- delete session rows just to make logout pass
- log the raw token
- return token hashes
- weaken `requireDemoSession`

Repeated logout behavior:
because the route itself requires an active session, a second use of the already-revoked token may correctly return 401.
Do not force it to return 200 if that conflicts with the current auth contract.

---

# 5. LOGOUT REGRESSION TESTS

Add regression coverage for BOTH relevant layers where practical.

At minimum prove:

- revoke query uses an actual null predicate, not string/timestamp `"null"`
- raw token is hashed before DB matching
- revoked session is rejected by active-session lookup
- route response for valid logout is successful
- reused revoked token is rejected

Tests must mock Supabase / repository dependencies.
Do not hit live Supabase from unit tests.

---

# 6. CURRENT MARKET IMPLEMENTATION — VERIFIED STATE

Current server environment code reads only:

```ts
process.env.DATA_GOV_IN_API_KEY
```

Current market service hardcodes:

Base URL:
`https://api.data.gov.in/resource`

Resource ID:
`9ef84268-d588-465a-a308-a864a43d0070`

Limit:
`1000`

Timeout:
`7000 ms`

The official dataset architecture itself is valid:
- Government of India data.gov.in
- AGMARKNET / Directorate of Marketing and Inspection daily mandi prices
- min / max / modal values are in INR per Quintal
- FarmPrism normalizes internally to INR per KG

Do NOT discard the existing normalization/fallback architecture.

---

# 7. NEW CANONICAL MARKET ENVIRONMENT CONTRACT

The developer already has the required local values.

Make these the canonical market variables:

```env
MARKET_PROVIDER=data_gov
MARKET_API_BASE_URL=https://api.data.gov.in/resource
MARKET_API_KEY=
MARKET_RESOURCE_ID=
MARKET_API_LIMIT=100
MARKET_API_TIMEOUT_MS=10000
```

These belong ONLY in:

`server/.env`

Never:
- root `.env`
- React Native source
- `EXPO_PUBLIC_*`
- logs
- committed real values

`MARKET_API_KEY` is secret.

`MARKET_RESOURCE_ID` is configuration, not a secret, but still read it from environment rather than hardcoding it.

---

# 8. TEMPORARY LEGACY MARKET-KEY COMPATIBILITY

Use:

`MARKET_API_KEY`

as the canonical API key.

For one transition period only:

if `MARKET_API_KEY` is absent/blank, fall back to:

`DATA_GOV_IN_API_KEY`

Document `DATA_GOV_IN_API_KEY` as deprecated compatibility.

Do not require the developer to duplicate the key after this phase.

---

# 9. SERVER MARKET CONFIG IMPLEMENTATION

Update `server/src/config/env.ts`.

Expose a market config with these effective values:

- provider
- apiBaseUrl
- apiKey
- resourceId
- limit
- timeoutMs

Recommended defaults:

- provider: `data_gov`
- apiBaseUrl: `https://api.data.gov.in/resource`
- limit: `100`
- timeoutMs: `10000`

Do NOT default the resource ID to the old hardcoded UUID.
The configured local `MARKET_RESOURCE_ID` is the source of truth.

Missing market credentials MUST NOT stop the Node server because DB market fallback exists.

Validation rules:

### MARKET_PROVIDER
Current supported provider:
`data_gov`

Unknown non-empty provider:
fail clearly at startup or disable official provider with an explicit safe config error.
Prefer clear validation.

### MARKET_API_BASE_URL
Must be HTTPS if explicitly configured.

### MARKET_API_LIMIT
Positive integer.
Use a sensible bounded range.
Do not allow absurd/unbounded values.

### MARKET_API_TIMEOUT_MS
Positive integer.
Use a sensible bounded range.

### MARKET_RESOURCE_ID
Treat as opaque resource identifier or validate as UUID if the existing data.gov resource format requires it.
Do not expose it as a secret.

### MARKET_API_KEY
Never print it.

Add pure parsing helpers if that makes tests reliable rather than mutating process.env globally throughout tests.

---

# 10. UPDATE MARKET SERVICE — NO HARDCODED OPERATIONAL CONFIG

Change the market service so the official request is constructed from configuration.

Conceptually:

```text
MARKET_API_BASE_URL
        +
MARKET_RESOURCE_ID
        ↓
data.gov.in resource URL
```

Query parameters remain:

- `api-key`
- `format=json`
- configured `limit`
- `filters[commodity]`
- `filters[state.keyword]=Maharashtra`
- `filters[district]` when a district is selected

Timeout:
configured `MARKET_API_TIMEOUT_MS`

Do not log the full request URL because it contains the API key.

If:
- provider disabled/unsupported
- key missing
- resource ID missing

then official fetch should be skipped cleanly and existing DB market observations should continue to work.

Do not return fake official provenance.

---

# 11. LIVE GOVERNMENT DATA PROVENANCE

Keep the existing honest behavior:

Official normalized point:
- `source = "data.gov.in / AGMARKNET"`
- `isDemo = false`

Prototype/DB seed:
- `isDemo = true` when appropriate

Farmer-facing UI must NOT repeatedly expose:
- fallback
- developer source terminology
- raw API diagnostics

Farmer may see one subtle source label:

When official data actually supplied the current observation:
`Market data: AGMARKNET`

When only prototype/demo DB observations are used:
`Demo market data`

Do not show official wording just because an API key exists.
Official wording requires a successful normalized official response.

---

# 12. PRICE INSIGHT — LOCKED FARMER UI

Do NOT re-expand the Farmer Price Insight screen.

Farmer sees only:

- Current Market Price
- Min
- Max
- Suggested Selling Price
- Next 7 Days

Primary display unit:
`₹ / Quintal`

Internal storage/calculation:
`₹ / KG`

Farmer does NOT see:

- 30/60/90 raw history
- confidence
- volatility
- moving averages
- active buyer signal counts
- full statistical reasoning
- developer fallback terminology

The backend may still use all of these internally.

---

# 13. PRICE RECOMMENDATION — COMPLETE THE LOCKED INPUTS CONSERVATIVELY

Current `recommendPrice()` already receives:

- market history
- quantity KG
- Farmer Declared Grade
- active Buyer signals

But the current numeric recommendation is primarily market-history/momentum/volatility driven.
Grade, quantity and demand are mostly context.

The product decision is that these factors should influence the recommendation, but market data must remain dominant.

Do NOT pretend this is a trained AI model.

Implement a SMALL, BOUNDED contextual adjustment.

Recommended exact prototype policy:

### Farmer Declared Grade
- Grade A: +1.5%
- Grade B: 0%
- Grade C: -1.5%
- null: 0%

### FarmPrism demand signal
Use the existing demand classification:
- high: +1.5%
- moderate: +0.5%
- low: 0%

### Quantity / liquidity
- `< 500 KG`: 0%
- `500–999.99 KG`: -0.5%
- `>= 1000 KG`: -1.0%

### Total contextual adjustment
Clamp final contextual modifier to:

`-3% ... +3%`

Apply it to the market-derived recommendation center/range AFTER market trend calculation.

Then keep volatility-based width/range behavior.

The adjustment must:
- never override market data dominance
- never make price <= 0
- never guarantee sale
- remain deterministic and testable
- be described internally as statistical/contextual adjustment, NOT AI verification

If the current implementation structure makes a different mathematically equivalent bounded approach clearly safer, document it in the phase report before using it.

Do not add more factors such as “necessity” unless there is actual data available for that factor.

---

# 14. OPTIONAL AI PROVIDER — DO NOT INVENT A VENDOR CONTRACT

Keep current optional environment:

- `AI_PROVIDER_API_KEY`
- `AI_PROVIDER_MODEL`
- `AI_PROVIDER_ENDPOINT`

Do not invent OpenAI/Gemini/etc. payloads without an explicitly configured provider contract.

If AI is not configured:
the statistical/contextual recommendation must work fully.

The prototype must not be blocked by external AI configuration.

If current provider only supplies explanation:
do not silently let it override numeric prices.

---

# 15. MARKET TEST COVERAGE

Update/add tests for:

- MARKET_API_BASE_URL used
- MARKET_RESOURCE_ID used
- MARKET_API_LIMIT used
- MARKET_API_TIMEOUT_MS used
- MARKET_API_KEY used
- legacy DATA_GOV_IN_API_KEY fallback works
- API key never appears in returned objects/errors/log assertions
- no key → official request skipped
- no resource ID → official request skipped
- invalid crop rejected
- Maharashtra filter preserved
- district filter preserved
- Tomato row normalization
- Onion row normalization
- Potato row normalization
- INR/Quintal → INR/KG conversion
- malformed date rejected
- non-positive price rejected
- invalid min/modal/max relationship rejected
- official response survives DB read outage
- cache write outage does not discard valid official response
- official outage falls back to DB observations
- contextual recommendation modifier stays within -3%/+3%
- Grade A recommendation > identical Grade B case, within bound
- Grade C recommendation < identical Grade B case, within bound
- high demand > identical low-demand case, within bound
- large lot adjustment remains bounded
- optional AI failure does not break numeric recommendation

Do not make tests depend on live data.gov.in.

---

# 16. LIVE MARKET SMOKE TEST — ONLY IF LOCAL CONFIG EXISTS

Do not print local secret values.

Check presence only for:

- MARKET_API_KEY
- MARKET_RESOURCE_ID

If configured:

start/reuse the Node server and test through the FarmPrism server contract.

Use an in-memory Farmer1 demo token without printing it.

Test:

- Tomato
- Onion
- Potato

Prefer Pune/Maharashtra context.

For each crop report one of:

- `OFFICIAL_PASS`
- `DB_FALLBACK`
- `NO_CURRENT_RECORD`
- `CONFIG_MISSING`
- `API_ERROR`

Do not treat a legitimate “no Pune record today” as a code regression if the fallback works.

Report:
- source type
- crop
- observed date
- min/max/modal numeric validity

Do NOT print:
- API key
- request URL containing key
- bearer token

---

# 17. ROOT `.env.example` REPOSITORY HYGIENE

The latest push currently contains project-specific public Supabase values and spaces after `=` in root `.env.example`.

Even though a publishable Supabase key is public-client material, `.env.example` should remain a clean template.

Change tracked root `.env.example` to:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MOCK_OTP=true

# Android emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

No spaces after `=`.

Do NOT touch the developer's ignored root `.env`.

Do NOT break support for the legacy anon key because mobile config currently supports:

publishable key first
→ anon key fallback

---

# 18. SERVER `.env.example`

Update tracked `server/.env.example` to:

```env
PORT=3000
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

MARKET_PROVIDER=data_gov
MARKET_API_BASE_URL=https://api.data.gov.in/resource
MARKET_API_KEY=
MARKET_RESOURCE_ID=
MARKET_API_LIMIT=100
MARKET_API_TIMEOUT_MS=10000

# Deprecated compatibility only:
# DATA_GOV_IN_API_KEY=

AI_PROVIDER_API_KEY=
AI_PROVIDER_MODEL=
AI_PROVIDER_ENDPOINT=
```

Never copy real local keys into this file.

Do NOT modify the ignored `server/.env` values except if a local variable name must be migrated carefully.
Preserve the developer's existing private values.

---

# 19. SUPABASE STATE ALREADY CHANGED EXTERNALLY — DO NOT RECREATE

The following database work is ALREADY complete outside the repository:

## A. Trust calculation

Existing RPC:
`demo_recalculate_trust(p_account_id uuid)`

It has already been corrected so Farmer Trust does NOT penalize an honest Grade C listing simply for being Grade C.

Product rule:
Product Quality Grade and Farmer Trust are separate concepts.

Farmer Trust reflects:
- feedback
- completed transaction reliability
- consistent declaration of quality

Do not alter the DB function in this Codex phase.

## B. Prototype reset

Existing RPC:
`demo_reset_prototype_data()`

Properties already verified:
- returns `jsonb`
- executable by `service_role`
- NOT executable by `anon`
- NOT executable by `authenticated`

Do NOT:
- recreate it
- make a migration
- grant it to client roles
- expose arbitrary SQL

---

# 20. DEVELOPMENT RESET TOOL — USE CLI, NOT MOBILE UI

Add a safe SERVER-SIDE CLI utility around the existing:

`demo_reset_prototype_data()`

Prefer this over an HTTP endpoint because it reduces accidental exposure.

Recommended structure:

- `server/src/services/devReset.service.ts`
- `server/scripts/resetPrototype.ts`

Add server script:

```json
"reset:demo": "tsx scripts/resetPrototype.ts"
```

Invocation should require an explicit confirmation argument:

```powershell
npm --prefix server run reset:demo -- RESET_FARMPRISM_DEMO
```

Safety rules:

- refuse when `NODE_ENV === "production"`
- require exact confirmation:
  `RESET_FARMPRISM_DEMO`
- call ONLY `demo_reset_prototype_data`
- no table names from CLI
- no arbitrary SQL
- no user-provided RPC name
- do not print service-role key
- do not print session tokens
- print only a safe reset summary returned by RPC

Do NOT run the real reset automatically during this phase.
The existing successful E2E data should remain until the developer deliberately chooses to reset it.

---

# 21. RESET TESTS

Use dependency injection/mock RPC calls.

Test:

- production mode rejected
- missing confirmation rejected
- wrong confirmation rejected
- correct development confirmation calls exactly `demo_reset_prototype_data`
- no arbitrary function name accepted
- no secret output

Do not invoke live reset from automated tests.

---

# 22. TRUST WORDING UPDATE

Do not change the existing DB trust function.

Update app/docs wording where needed so:

Farmer “quality consistency” does NOT mean:
“percentage of Grade A/B produce”

It means:
“consistency of declaring produce quality for listed produce”

Never imply:
Grade C = untrustworthy.

Keep Trust Score OFF Farmer Home.

Public counterpart profiles may continue to show Trust Score.

---

# 23. DOCUMENTATION — ACTUALLY CLEAN IT, DO NOT ADD ANOTHER SUPERSEDING BANNER

Current main docs are internally contradictory.

Examples verified before this prompt:

README currently still says:
- Node/Express is a future scaffold
- Buyer/Logistics screens are not implemented
- demo session token will be introduced later
- mobile is not yet wired to Node

DEVELOPMENT_GUIDE currently still says:
- latest phase is 2.0.6
- mobile does not call Node
- Buyer/Logistics final UI overhaul remains future

PROJECT_REQUIREMENTS still contains historical sections saying:
- session token will be added later
- secondary My Farm screens are future
- Buyer/Logistics are “planned”
- do not wire mobile to Node
- do not build Buyer/Logistics screens

AGENTS still references Phase 2.0.6 and old UI restrictions.

These stale statements can mislead future Codex/VS Code work.

Rewrite/clean:

- `README.md`
- `PROJECT_REQUIREMENTS.md`
- `DEVELOPMENT_GUIDE.md`
- `AGENTS.md`

Do not preserve contradictions just because they are historical.
Phase-specific history already exists in phase files.

---

# 24. CURRENT DOCUMENTED PRODUCT TRUTH

The cleaned docs must state:

## Architecture
React Native / Expo
→ Node/Express business API
→ Supabase

Supabase:
- persisted source of truth
- RLS boundary for real auth
- transactional/demo RPCs

Node:
- demo session authorization
- marketplace orchestration
- market API adapter
- price intelligence
- payments
- logistics
- GPS
- delivery OTP
- feedback/trust reads
- dev reset CLI integration

## Roles
Exactly:
- farmer
- buyer
- logistics

FPO:
- Coming Soon UI only
- not persisted role
- not Buyer subtype

## Auth
Prototype:
- 9 fixed demo accounts
- any six-digit OTP
- server-issued demo session token implemented
- SecureStore/mobile session flow implemented

Future:
- real SMS OTP

## Crops
Only:
- Tomato
- Onion
- Potato

## Farmer
Implemented:
- Home
- My Farm
- Sell
- Insights
- Profile
- Notifications
- secondary Sell/transaction screens

Home + My Farm approved/frozen visually.

## Selling
Implemented:
- Auction
- Fixed Price

Auction:
- 6/12/24h
- 24h default
- partial quantity
- bid revision
- bid withdrawal
- farmer accepts any suitable bid
- no auto-highest winner

Fixed:
- Farmer fixed price
- 24h expiry
- Buyer cannot negotiate price
- Buyer requests quantity + 10–90% advance

## Quality
Prototype:
Farmer Declared A/B/C

Future:
camera/video + genuine AI quality

Never call prototype quality AI Verified.

## Market
Government:
data.gov.in / AGMARKNET adapter

Farmer UI:
Current / Min / Max / Suggested / Next 7 Days

History/statistics internal.

## Payments
Simulated prototype payments.

Farmer advance:
mutually accepted Buyer proposal, 10–90%.

Logistics:
40% advance / 60% final.

Platform logistics fee:
₹0

Logistics receives:
100% agreed fee.

## Logistics
Implemented:
- available jobs
- first eligible claim wins atomically
- fee proposal
- pickup
- actual GPS
- development simulated GPS
- delivery OTP
- history/profile

## Delivery
Buyer sees OTP
→ tells Logistics
→ Logistics verifies
→ OTP verification itself confirms delivery

## Feedback / Trust
Implemented.

Trust:
backend-controlled.

Grade C alone must not reduce Trust.

## Disputes
Backend foundation only.
No dispute UI.

## Blockchain
Completely future.
No fake chain/hashes.

## Designer specs
Designer screen pack:
`assets/FarmPrism_Designer_Screen_MDs/`

This is the current screen-behavior/design brief.

---

# 25. PHASE 2.0.11 REPORT

Create:

`PHASE_2_0_11.md`

Include concise sections:

1. Starting verified state
2. Full Auction live PASS
3. Full Fixed Price live PASS
4. Completed order codes:
   - FP-11332B8B3E
   - FP-25A03D7831
5. Logout failure root cause
6. Logout fix
7. Market env migration
8. Official data live-test result per crop
9. Price contextual adjustment policy
10. Reset CLI
11. Trust semantic correction already present in DB
12. Docs cleanup
13. Validation results
14. Remaining blockers, if any

Do not include:
- keys
- raw bearer tokens
- secret URLs

---

# 26. DO NOT TOUCH THESE WORKING AREAS

Unless a test directly fails, DO NOT change:

- Farmer Home rendering
- Farmer My Farm rendering
- Auction acceptance RPC behavior
- Fixed Price acceptance RPC behavior
- partial quantity reconciliation
- bid replacement/history
- Buyer advance contract
- first Logistics claim
- logistics fee acceptance
- 40/60 logistics payment split
- pickup transition
- tracking transition
- delivery OTP semantics
- final balance completion
- feedback transaction logic
- inventory reconciliation
- bottom navigation semantics already fixed in Phase 2.0.10

These already passed live.

---

# 27. VALIDATION

Run:

```powershell
npm run typecheck
npm run test:mobile
```

Server:

```powershell
npm --prefix server run typecheck
npm --prefix server run build
npm --prefix server test
```

Android export:

```powershell
npx expo export --platform android --output-dir .expo/phase-2-0-11-export
```

Repository:

```powershell
git diff --check
```

Do not commit.
Do not push.

---

# 28. TARGETED LIVE RETEST — LOGOUT ONLY

Do NOT repeat the entire Auction/Fixed E2E unless a regression requires it.

Use Farmer1.

1. Create a demo session with any six-digit OTP.
2. Store raw token only in process memory.
3. Call authenticated `/api/workspace`.
4. Call `POST /api/demo/logout`.
5. Retry `/api/workspace` using the same token.

Expected:

- session create: PASS
- first workspace: PASS
- logout: PASS
- reused revoked token: 401/rejected

Do not print raw token.

Optionally repeat logout check with Buyer1 and Logistics1 only if the Farmer1 test exposes role-specific behavior.
Logout itself should be role-independent.

---

# 29. TARGETED MARKET LIVE RETEST

If local MARKET_API_KEY + MARKET_RESOURCE_ID are configured:

Test Tomato, Onion, Potato.

Do not mutate marketplace state.

For each report:

Crop:
Official fetch attempted:
Official normalized rows:
Effective source:
Latest observed date:
Fallback used:

Do not print key.

Do not fail the whole phase merely because a crop has no fresh Pune row if:
- API behaved correctly
- DB fallback is healthy
- provenance remains honest

---

# 30. FINAL REPORT — USE THIS EXACT STRUCTURE

## Repository baseline
Development base commit:
[sha]

Unexpected pre-existing local changes:
[none OR list]

## Live E2E preserved
Auction full live E2E:
PASS

Fixed Price full live E2E:
PASS

Auction order:
FP-11332B8B3E

Fixed Price order:
FP-25A03D7831

Core transaction logic changed:
MUST BE NO

## Logout
Active demoStore null bug fixed:
yes/no

Duplicate repository null bug fixed:
yes/no

Logout unit regression:
pass/fail

Live session create:
pass/fail

Live workspace before logout:
pass/fail

Live logout:
pass/fail

Revoked token rejected:
pass/fail

Raw token logged:
MUST BE NO

## Market config
MARKET_PROVIDER:
supported/not supported

MARKET_API_BASE_URL:
supported/not supported

MARKET_API_KEY:
supported/not supported

MARKET_RESOURCE_ID:
supported/not supported

MARKET_API_LIMIT:
supported/not supported

MARKET_API_TIMEOUT_MS:
supported/not supported

Legacy DATA_GOV_IN_API_KEY compatibility:
yes/no

Hardcoded resource ID removed:
yes/no

Hardcoded 1000 limit removed:
yes/no

Hardcoded 7000ms timeout removed:
yes/no

## Government market live checks
Tomato:
OFFICIAL_PASS / DB_FALLBACK / CONFIG_MISSING / API_ERROR

Onion:
OFFICIAL_PASS / DB_FALLBACK / CONFIG_MISSING / API_ERROR

Potato:
OFFICIAL_PASS / DB_FALLBACK / CONFIG_MISSING / API_ERROR

API key printed:
MUST BE NO

## Price intelligence
Government/market data remains dominant:
yes/no

Grade influence:
yes/no

Demand influence:
yes/no

Quantity influence:
yes/no

Context modifier bounded to ±3%:
yes/no

Farmer raw history visible:
MUST BE NO

Farmer confidence visible:
MUST BE NO

Fake AI claims added:
MUST BE NO

## Reset
Existing Supabase reset RPC recreated:
MUST BE NO

Development reset CLI created:
yes/no

Production guard:
pass/fail

Confirmation guard:
pass/fail

Live reset executed automatically:
MUST BE NO

## Trust
DB trust function modified by Codex:
MUST BE NO

Docs clarify Grade C is not untrustworthy:
yes/no

Trust remains absent from Farmer Home:
yes/no

## Env hygiene
Tracked root .env.example contains real project publishable value:
MUST BE NO

Tracked root .env.example spacing cleaned:
yes/no

server/.env.example uses MARKET_* contract:
yes/no

Real market key committed:
MUST BE NO

Real service-role key committed:
MUST BE NO

## Docs
README current:
yes/no

PROJECT_REQUIREMENTS current:
yes/no

DEVELOPMENT_GUIDE current:
yes/no

AGENTS current:
yes/no

PHASE_2_0_11.md created:
yes/no

Designer MD pack preserved:
yes/no

## UI freeze
Farmer Home visual changed:
MUST BE NO

Farmer My Farm visual changed:
MUST BE NO

Buyer/Logistics broad redesign in this phase:
MUST BE NO

## Validation
Root typecheck:
pass/fail

Mobile tests:
pass/fail + count

Server typecheck:
pass/fail

Server build:
pass/fail

Server tests:
pass/fail + count

Android export:
pass/fail/not-run

git diff --check:
pass/fail

## Files changed
[list]

## Remaining prototype blockers
[none OR exact list]

DO NOT COMMIT.
DO NOT PUSH.
