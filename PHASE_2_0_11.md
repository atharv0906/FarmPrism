# Phase 2.0.11 — Prototype finalization

## Starting verified state

Development base: 903f81067b478a6935ff068abd3f40571e38a509 (SOME TEST and uploaded the AGMARKET API). Worked directly in the current local Development tree. Pre-existing changes preserved: deleted assets/FarmPrism_Designer_Screen_MDs.zip; untracked nested assets/FarmPrism_Designer_Screen_MDs/FarmPrism_Designer_Screen_MDs/; untracked assets/FarmPrism_Phase_2_0_11_Finalization_RECHECKED.md.

Full Auction live E2E: PASS, order FP-11332B8B3E. Full Fixed Price live E2E: PASS, order FP-25A03D7831. These prior tests covered quality, insight, publish, proposal/revision, acceptance, advances, logistics claim/fee/pickup/tracking, delivery OTP, balances, completion, feedback, notifications, trust and inventory. No full transaction replay in this phase.

Final read-only verification found both orders and jobs still completed, with 10 KG allocated to each and remaining batch quantities 240 KG / 90 KG. Core transaction logic, RPC definitions and UI navigation semantics were unchanged.

## Logout failure and fix

Both server/src/lib/demoStore.ts (active route path) and server/src/repositories/demo.repository.ts used .eq('revoked_at', null). PostgREST interpreted this as timestamp text "null", producing PostgreSQL 22007 and generic HTTP 500 at POST /api/demo/logout. Both now use .is('revoked_at', null), matching [Supabase null-filter documentation](https://supabase.com/docs/reference/javascript/using-filters-is). No session rows are deleted and auth middleware is unchanged.

A mocked Supabase regression covers both implementations: hash matching, actual IS NULL predicate, persisted revocation, active-session rejection, real logout route success, protected-route rejection and repeated logout 401. Response assertions exclude raw tokens and hashes.

Targeted live Farmer1 retest through the current Node app:

| Step | Result | HTTP |
| --- | --- | --- |
| POST /api/demo/session | PASS | 200 |
| GET /api/workspace before logout | PASS | 200 |
| POST /api/demo/logout | PASS | 200 |
| GET /api/workspace with same revoked token | PASS | 401 |

Raw token existed only in process memory and was never logged or written. The role-independent fix needed no Buyer/Logistics repeat. The live check started an isolated local listener from the current server build and closed it afterward.

## Market environment migration

Canonical env.market configuration comes from pure parseMarketConfig: provider, apiBaseUrl, apiKey, resourceId, limit and timeoutMs. Defaults: data_gov, HTTPS https://api.data.gov.in/resource, 100 rows, 10000 ms. Resource ID has no default. Canonical MARKET_API_KEY wins; blank/missing canonical key uses deprecated DATA_GOV_IN_API_KEY. No ignored private environment file was changed.

Unknown providers fail safely. Base URL requires HTTPS without credentials/query/fragment. Limit is bounded 1–1000, timeout 1–60000 ms. Validation errors name the variable without its value. Requests use configured resource/limit/timeout, preserve Maharashtra and district filters, and reject redirects rather than forwarding credential-bearing URLs. Missing key/resource skips official requests. No raw request URL is logged; provider rows containing an echoed key are discarded.

Existing normalization and fallback architecture remains: INR/Quintal → INR/KG, valid real date, positive ordered min/modal/max, valid official response survives DB read or cache-write failure, official outage falls back to DB observations. Current observation isDemo now remains independent from older demo history; confidence can still reflect mixed historical inputs internally.

## Official data live checks

Both canonical key and resource were present (values not printed). Farmer1's owned crop batches supplied persisted Pune context via POST /api/farmer/price-insight. These market reads used the current FarmPrism API and existing normalized market cache, without marketplace commands. No reset ran.

| Crop | Result | Official attempted | Normalized rows | Source | Observed date | Min / modal / max INR/KG | Valid | Fallback |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Tomato | OFFICIAL_PASS | yes, HTTP 200 | 3 | data.gov.in / AGMARKNET, isDemo=false | 2026-09-12 | 15 / 15 / 15 | yes | no |
| Onion | OFFICIAL_PASS | yes, HTTP 200 | 4 | data.gov.in / AGMARKNET, isDemo=false | 2026-09-12 | 20 / 32.5 / 45 | yes | no |
| Potato | OFFICIAL_PASS | yes, HTTP 200 | 3 | data.gov.in / AGMARKNET, isDemo=false | 2026-09-12 | 14 / 15 / 16 | yes | no |

The reported values are the effective current observations returned by the server, not an invented district-wide average. Safe request metadata and results are retained in ignored .expo/phase-2-0-11/live-results.json; the ignored live-smoke.cjs harness holds no credentials.

## Price contextual adjustment policy

Applied the exact requested policy: Grade A +1.5%, B/null 0%, C -1.5%; high demand +1.5%, moderate +0.5%, low 0%; quantity below 500 KG 0%, 500–999.99 KG -0.5%, at least 1000 KG -1%. Total clamps to ±3%. Market momentum calculates first, contextual multiplier adjusts the center, and existing volatility width determines the range. Positive-price floor and no-guarantee language remain.

Tests cover boundaries, Grade A/B/C ordering, demand influence, large lots, positivity and optional AI failure. This is statistical/contextual adjustment, not a trained model or verified quality. Existing optional explanation gateway remains unchanged and cannot override numeric prices. Farmer raw history/confidence/diagnostics remain hidden; Price Insight rendering was not expanded.

## Reset CLI

Added server/src/services/devReset.service.ts and server/scripts/resetPrototype.ts. Deliberate invocation:

```powershell
npm --prefix server run reset:demo -- RESET_FARMPRISM_DEMO
```

The CLI rejects production and anything other than exactly one confirmation argument. It calls only existing demo_reset_prototype_data(), never arbitrary SQL/table/RPC input, and whitelists deployed safe summary booleans, numeric counts and IDs. Errors do not print private RPC diagnostics. The CLI is included in server typecheck through tsconfig.scripts.json without changing build output layout. No HTTP/mobile reset surface.

Read-only metadata inspection confirmed the deployed RPC summary shape. The RPC was not recreated, changed or executed. Mock tests prove production/confirmation guards, fixed RPC dispatch, no arbitrary-function input and safe output/errors. Successful E2E records remain intact.

## Trust semantic correction already present in DB

The externally corrected demo_recalculate_trust was not modified. Product quality grade and Farmer Trust are distinct. Quality consistency means consistency of declaring produce quality for listed produce, not the percentage of Grade A/B produce. Grade C alone is not untrustworthy. Shared profile wording now says Quality declaration consistency; Trust remains absent from Farmer Home.

## Environment hygiene and documentation cleanup

Tracked root/server .env.example files now contain the requested blank templates and safe defaults, with no project-specific public key or spaces after equals. Private ignored environments were not changed. Mobile key resolution now handles a blank publishable-key template field by falling back to the legacy anon key; a regression checks precedence and missing/blank/whitespace cases.

README, PROJECT_REQUIREMENTS, DEVELOPMENT_GUIDE and AGENTS were rewritten around current implemented behavior rather than adding superseding banners. They document the current architecture, sessions, roles/crops, selling/payment/logistics/OTP/trust flows, market/AI boundaries, reset CLI, UI freeze, designer pack and explicit future scope. Historical phase files remain history.

## Validation results

| Check | Result |
| --- | --- |
| npm run typecheck | PASS |
| npm run test:mobile | PASS, 17/17 |
| npm --prefix server run typecheck | PASS, including reset CLI |
| npm --prefix server run build | PASS |
| npm --prefix server test | PASS, 92/92 |
| Android export to .expo/phase-2-0-11-export | PASS |
| git diff --check | PASS |
| Targeted live Farmer1 logout | PASS, 200 → 200 → 200 → 401 |
| Official Pune market, all three crops | OFFICIAL_PASS |
| Existing completed E2E order/job state | PASS, preserved |

The restricted runner initially failed before server tests with uv_os_get_passwd ENOMEM. Running the same suite through approved execution resolved the environment failure; no code workaround was added. Mobile typecheck/tests/export were rerun after the public-key fallback change. No API-only check is presented as a device UI walkthrough.

Approved Farmer Home/My Farm render files, designer MD pack and core mutation routes/service/repository have no changes. No schema, migrations, RLS, deployed RPC, Git-history, branch, commit or push operations were performed. No real reset, production payment, blockchain, SMS or visual AI was implemented/executed.

## Remaining prototype blockers

None for the requested Phase 2.0.11 scope. Production features remain explicitly future scope. Government availability is external and can legitimately require the tested honest fallback.

## Files changed in this phase

- .env.example
- AGENTS.md
- DEVELOPMENT_GUIDE.md
- PHASE_2_0_11.md
- PROJECT_REQUIREMENTS.md
- README.md
- server/.env.example
- server/package.json
- server/scripts/resetPrototype.ts
- server/src/config/env.ts
- server/src/config/marketConfig.test.ts
- server/src/config/marketConfig.ts
- server/src/lib/demoStore.ts
- server/src/repositories/demo.repository.ts
- server/src/routes/demo.logout.test.ts
- server/src/routes/integration.routes.ts
- server/src/services/devReset.service.test.ts
- server/src/services/devReset.service.ts
- server/src/services/market.service.test.ts
- server/src/services/market.service.ts
- server/tsconfig.scripts.json
- src/config/env.ts
- src/screens/trading/SharedScreens.tsx
- tests/public-env.test.ts

Pre-existing asset changes listed above were preserved. Ignored validation artifacts live under .expo/phase-2-0-11/ and .expo/phase-2-0-11-export/. Private-value scan of changed source/docs/examples found 0 matches.
