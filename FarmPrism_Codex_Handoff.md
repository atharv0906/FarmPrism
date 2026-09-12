# FarmPrism — Complete Codex Handoff Specification
Version: 1.0
Date: 2026-09-05
Purpose: Single source of truth for continuing FarmPrism development in Codex.

---

## 0. IMPORTANT INSTRUCTION TO CODEX

You are taking over an existing project called **FarmPrism**.

Treat this document as the current product and engineering specification. Do not redesign the product from scratch unless explicitly asked. Preserve the agreed product flow, terminology, role model, and UI direction.

The most important current requirement is:

> **The implemented app must match the previously approved FarmPrism UI/UX direction shown in the reference screenshots, while being a working Expo/React Native application connected to the FarmPrism Supabase backend.**

Do not substitute a generic dashboard template, generic agriculture UI, or a different navigation structure merely because it is easier to implement.

Before changing architecture:
1. Inspect the existing repository.
2. Identify the current Expo/React Native setup.
3. Identify current routes/screens/components.
4. Identify Supabase configuration and migrations.
5. Identify what is already implemented versus placeholder/mock code.
6. Run the app and reproduce existing issues.
7. Fix the root causes rather than layering another implementation on top.
8. Preserve useful existing code where it is compatible with this specification.
9. Do not delete working functionality without checking dependencies.

If a requirement is not explicitly finalized below, implement the simplest maintainable solution and keep the architecture extensible.

---

# 1. PRODUCT OVERVIEW

## Product name

**FarmPrism**

## Core idea

FarmPrism is a unified agricultural commerce, operations, logistics, and market platform intended to connect:

- Farmers
- Farmer Producer Organizations (FPOs)
- Buyers
- Logistics / transport operators
- Administrators / platform operators

The platform should make the movement of agricultural produce more organized and traceable:

**Farmer → Produce/Batch → FPO / Marketplace → Buyer → Logistics → Delivery**

The platform should reduce fragmentation in agricultural transactions and logistics while providing a common digital workflow.

---

# 2. PRODUCT PRINCIPLES

1. **One common app**
   - The app is not a separate app for every role.
   - Farmer, FPO, buyer, and logistics users operate within the same application.
   - The user's selected/active role determines the dashboard and available actions.

2. **Role-based experience**
   - Authentication identifies the user.
   - The user can have one or more roles.
   - The UI exposes only the functionality relevant to the active role.

3. **Persistent role memory**
   - FarmPrism should remember the user's last selected role.
   - On the next launch/login, if the user's session is valid and the role is still available, open the appropriate dashboard directly rather than forcing role selection every time.
   - Provide a way to switch roles where the account has multiple roles.

4. **Mobile-first**
   - Primary product is a mobile application.
   - Expo + React Native is the expected client technology.

5. **Real data**
   - Avoid permanent hardcoded/mock data.
   - Data should ultimately come from Supabase.
   - Loading, empty, error, and offline/degraded states must be handled.

6. **Trust and traceability**
   - Transactions and physical produce movement should be traceable.
   - A trust score exists as a future/late-stage feature.
   - **Do not make Trust Score a core dependency of the current MVP. It will be implemented at the end.**

7. **Logistics is permanent**
   - Logistics is not a temporary/demo module.
   - It is a permanent part of the FarmPrism architecture and product.

---

# 3. USER ROLES

The unified app supports these roles:

## 3.1 Farmer

Primary responsibilities:
- Manage profile/farm information
- Add/manage produce
- Create/manage produce activities
- Create/maintain physical batch records
- View produce/market opportunities
- Participate in selling/auction workflows where enabled
- View orders/transactions
- Request/track logistics
- View relevant notifications and status updates

## 3.2 FPO

FPO = Farmer Producer Organization.

The FPO acts as an organized aggregation and coordination layer between farmers and buyers/market channels.

Expected responsibilities:
- Manage/represent member farmers
- Aggregate farmer produce
- Coordinate physical batches
- Coordinate selling/market activities
- Coordinate orders and fulfillment
- Coordinate logistics
- View operational/transaction status
- Potentially act as an intermediary for procurement/sales
- Support quality/quantity verification workflows
- Manage FPO-level operations

Important:
- FPO should not be treated simply as another farmer profile.
- FPO has organization-level responsibilities and may handle multiple farmers/batches/orders.

## 3.3 Buyer

Primary responsibilities:
- Discover available produce
- View produce details
- Place purchase/order requests where supported
- Participate in auction/buying workflows where enabled
- Track orders
- Coordinate logistics/receive delivery
- View transaction status/history

## 3.4 Logistics

Logistics is a **permanent role/module**.

Primary responsibilities:
- Receive/see assigned transport jobs
- View pickup and delivery information
- View batch/order information relevant to transport
- Update pickup status
- Update in-transit status
- Update delivered status
- Record relevant logistics events
- Provide delivery proof/status as the architecture evolves

The same logistics application experience should work for logistics operators rather than requiring a separate unrelated app.

## 3.5 Admin / Platform operations

Admin is an internal operational role.

Expected capabilities:
- User/role oversight
- FPO oversight
- Produce/category configuration
- Order/transaction oversight
- Logistics oversight
- System-level issue management
- Future trust/reputation management

Do not overbuild admin features unless required.

---

# 4. HIGH-LEVEL USER JOURNEY

The agreed initial experience includes:

1. Splash / launch
2. Welcome / Get Started
3. Language selection
4. Authentication / onboarding
5. Role selection where required
6. Role-specific dashboard
7. Role-specific workflows

### Splash / Welcome

The flow should begin with a polished FarmPrism splash/welcome experience.

A previously requested flow explicitly included:

**Splash/Welcome → Get Started → Language Selector**

Do not remove these states simply because authentication is easier to show first.

### Language

Language selection is part of onboarding.

Architecture should make localization possible instead of hardcoding all text throughout components.

At minimum, the system should be designed so additional Indian/local languages can be added without rewriting screen logic.

---

# 5. ROLE MEMORY

FarmPrism should remember the last active role.

Expected behavior:

- User logs in.
- If user has one valid role → open that role's dashboard.
- If user has multiple roles:
  - restore the last selected role if valid;
  - otherwise show role selection.
- Persist the selected role locally.
- The persisted role must not override server-side authorization.
- On logout, decide whether local role preference remains or is cleared based on implementation; authentication security takes priority.

Recommended client-side storage:
- Expo SecureStore for sensitive session-related state where appropriate.
- AsyncStorage for non-sensitive UI preferences if needed.

---

# 6. UI / UX REQUIREMENTS

## 6.1 Most important UI requirement

The UI must follow the previously supplied reference screenshots.

The screenshots were supplied in the earlier project conversation and represent the desired visual direction. The previous implementation had a problem where:

- Expo preview was not working correctly.
- The rendered UI did not match the screenshots.
- Screens looked like a generic/alternate implementation.

Do not repeat that mistake.

### Required approach

1. Inspect existing UI implementation.
2. Reconstruct the approved design system from the reference screens.
3. Use consistent:
   - spacing
   - typography
   - card styles
   - corner radii
   - icon treatment
   - navigation
   - buttons
   - colors
   - visual hierarchy
4. Keep the visual language consistent across every role.
5. Do not introduce unrelated design patterns.

## 6.2 Do not artificially limit screens

The previous discussion explicitly established:

> Do not restrict the implementation to exactly 18 screens/states.

If the correct flow requires 20, 25, 30, or more states, implement them.

The screen count is not a design constraint.

The flow and product requirements are the constraint.

## 6.3 UI states

Every meaningful screen should account for:

- Normal state
- Loading state
- Empty state
- Error state
- Success/confirmation state where relevant
- Disabled state where relevant
- Permission/authentication failure where relevant

---

# 7. CORE INFORMATION ARCHITECTURE

The application can be viewed as these major domains:

1. Authentication & onboarding
2. Role management
3. Farmer operations
4. FPO operations
5. Produce
6. Produce activity
7. Physical batch management
8. Marketplace / discovery
9. Auction / buying
10. Orders
11. Logistics
12. Notifications
13. Profile/settings
14. Admin operations
15. Future trust score

---

# 8. PRODUCE

Produce is the agricultural product being grown/handled/sold.

Examples:
- Tomato
- Onion
- Potato
- Wheat
- Rice
- Fruits
- Vegetables
- Other supported crops/categories

Produce should have structured information rather than being represented only as a free-text label.

Potential attributes:
- Produce type/category
- Variety
- Quantity
- Unit
- Quality/grade
- Location
- Farmer/FPO ownership
- Availability
- Status

Do not reintroduce a `Created/Harvest Date` field as a mandatory produce/batch concept unless explicitly requested later.

---

# 9. PRODUCE ACTIVITY

The user previously asked:

> "What is in the produce activity?"

Produce Activity is the operational record describing an agricultural activity associated with a produce/crop lifecycle.

Examples may include:
- Sowing
- Cultivation activity
- Irrigation
- Fertilization
- Crop care
- Harvest activity
- Quality-related activity
- Other production/handling events

The exact activity taxonomy should be configurable.

Important distinction:

### Produce Activity
An **activity/event record** associated with produce production/handling.

### Physical Batch Record
A **physical inventory/lot record** representing actual produce that exists and can be aggregated, sold, ordered, and transported.

Do not merge these concepts.

---

# 10. PHYSICAL BATCH RECORD

Physical Batch Record represents a real, physically identifiable quantity/lot of produce.

It is important for traceability.

A batch can be associated with:
- Farmer
- FPO
- Produce
- Quantity
- Unit
- Quality/grade
- Current status
- Location
- Aggregation
- Order
- Logistics movement

The batch is the bridge between digital produce information and physical agricultural goods.

## Important previously finalized change

**Remove `Created/Harvest Date` from the physical batch record.**

Do not add it back as a required field.

If future traceability requires dates, use explicit event records rather than silently reintroducing the removed field.

---

# 11. BATCH LIFECYCLE

A batch should have a clear state machine.

Example states:

- Draft
- Available
- Reserved
- Allocated
- In Sale / Market
- Sold
- Preparing for Pickup
- Picked Up
- In Transit
- Delivered
- Cancelled
- Rejected / Quality Hold

Do not allow arbitrary status strings throughout the codebase.

Use centralized enums/constants/types.

Exact status transitions should be validated server-side where possible.

---

# 12. FPO AGGREGATION

A key role of the FPO is aggregation.

Conceptually:

Farmer A batch
+
Farmer B batch
+
Farmer C batch
→
FPO aggregated inventory / commercial lot
→
Buyer/order
→
Logistics

The system should preserve the relationship between:
- original farmer batches
- FPO aggregation
- commercial/market listing
- buyer order
- final logistics movement

Do not destroy source-batch relationships when aggregating.

---

# 13. MARKETPLACE

The marketplace/discovery layer allows buyers to discover available produce.

Potential listing information:
- Produce
- Quantity available
- Quality/grade
- Seller/Farmer/FPO
- Location
- Pricing model
- Availability
- Relevant batch/lot information
- Sale status

The exact UI should follow the reference design.

---

# 14. AUCTION

Auction was discussed previously.

Do not implement "auction rules/time" as an unexplained generic field.

If auctions are enabled, model them explicitly.

An auction can contain:
- Auction/listing ID
- Produce/batch/listing
- Start/end time
- Status
- Bids
- Buyer
- Winning bid
- Settlement/order relationship

Example states:
- Scheduled
- Open
- Closed
- Awarded
- Cancelled

The auction system must have clear validation and server-side authority.

---

# 15. ORDERS

An order represents a commercial purchase transaction.

Potential relationships:

Buyer
→ Order
→ Order Items
→ Produce/Commercial Lot
→ Source Physical Batches
→ Logistics Job
→ Delivery

Order states should be controlled, e.g.:

- Draft
- Pending
- Confirmed
- Processing
- Ready for Pickup
- In Transit
- Delivered
- Cancelled
- Disputed (future)

Do not conflate order status with logistics status.

---

# 16. LOGISTICS

## Permanent module

Logistics is permanent and must be treated as a first-class domain.

### Core concept

A logistics job links a commercial/physical movement to transport.

Typical flow:

Order confirmed
→ pickup required
→ logistics job created/assigned
→ pickup
→ in transit
→ delivery
→ delivered

### Logistics job information

Potential fields:
- Job ID
- Order ID
- Batch ID / batch references
- Pickup party/location
- Drop party/location
- Assigned logistics user/operator
- Vehicle information if required
- Status
- Timestamps/events
- Delivery proof/reference if required later

### Logistics states

At minimum:
- Pending Assignment
- Assigned
- Pickup Scheduled
- Picked Up
- In Transit
- Delivered
- Failed / Exception
- Cancelled

Again, do not use free-form status strings.

---

# 17. LOGISTICS APP EXPERIENCE

The app is the same application for all users.

Logistics users should not be forced into a completely separate app identity.

When the active role is Logistics, show:
- Logistics dashboard
- Assigned jobs
- Job details
- Pickup action
- In-transit action
- Delivery action
- Relevant notifications
- Profile/settings

The UI should maintain the same FarmPrism design language.

---

# 18. NOTIFICATIONS

Notifications should be event-driven.

Examples:
- New order
- Order confirmed
- Auction result
- Batch reserved
- Pickup assigned
- Pickup completed
- Shipment in transit
- Delivery completed
- FPO action required
- Buyer action required

Design notifications as a reusable domain rather than hardcoding banners into individual screens.

---

# 19. TRUST SCORE

Trust Score is intentionally deferred.

Previous decision:

> **We will do the trust score at the end.**

Therefore:

- Do not make current workflows depend on Trust Score.
- Do not block transactions because Trust Score is missing.
- Keep the architecture extensible enough to add it later.
- Avoid inventing a scoring algorithm now.
- Avoid adding fake trust-score values to production UI unless explicitly needed for a prototype.

---

# 20. AUTHENTICATION

Use Supabase Auth unless the existing project already contains a deliberate compatible authentication implementation.

Expected architecture:
- Supabase Auth handles authentication/session.
- Application database stores profile/role/domain information.
- Authorization must be enforced by Supabase Row Level Security (RLS), not only by hiding UI.

Potential authentication methods:
- Phone OTP
- Email/password
- Other methods only if already required by the project.

Do not assume a user is authorized merely because their client says they are a Farmer/FPO/Buyer.

---

# 21. SUPABASE DATABASE PRINCIPLES

FarmPrism is intended to use Supabase/PostgreSQL.

Recommended principles:

- UUID primary keys
- Foreign keys
- Explicit status enums or constrained values
- Timestamps
- `created_at`
- `updated_at`
- Soft-delete/archive where appropriate
- RLS policies
- Audit/event records for important state transitions
- Avoid excessive JSON blobs when relational columns are more appropriate
- Avoid duplicate denormalized state unless there is a clear performance reason

---

# 22. RECOMMENDED DATABASE DOMAIN MODEL

The exact current schema must be inspected before changing it.

A robust target architecture can contain entities along these lines:

## Identity
- profiles
- user_roles
- organizations
- organization_members

## Agriculture
- produce_categories
- produce
- produce_activities
- physical_batches
- batch_events
- batch_sources / aggregation relationships

## Marketplace
- listings
- listing_items
- auctions
- bids

## Commerce
- orders
- order_items
- transactions/payment records if required

## Logistics
- logistics_jobs
- logistics_events
- vehicles (if needed)
- delivery_proofs (if needed)

## Communication
- notifications

## Administration
- audit_logs
- configuration/reference data

## Future
- trust_scores
- trust_events

Do not blindly create all these tables if equivalent tables already exist. First inspect the repository and Supabase schema.

---

# 23. RELATIONSHIP MODEL

Conceptual relationship:

User
→ Profile
→ Roles

Farmer
→ Farmer profile / organization membership
→ Produce
→ Produce Activities
→ Physical Batches

FPO
→ Organization
→ Organization Members
→ Aggregated batches
→ Listings/orders

Buyer
→ Buyer profile
→ Orders
→ Order items

Physical Batch
→ Listing / Order item
→ Logistics Job

Order
→ Logistics Job

Logistics Job
→ Logistics Events

All important entities
→ Audit/events where required

---

# 24. ROLE / AUTHORIZATION MODEL

Authorization should distinguish:

### Authentication
"Who is this user?"

### Role
"What role(s) does this user have?"

### Organization membership
"Which FPO/organization does this user belong to?"

### Resource ownership
"Can this user access this specific batch/order/job?"

### Action permission
"Can this user perform this action?"

Do not solve all four problems with one `role` string.

---

# 25. RLS REQUIREMENTS

Supabase RLS must be used for production data protection.

Examples of intended authorization principles:

Farmer:
- Read/update own profile
- Read/write own produce
- Read/write own permitted activities
- Read/write own batches
- Access orders involving their produce where appropriate

FPO:
- Access organization-level records
- Access member-related records according to organization membership
- Manage permitted aggregated batches/listings/orders

Buyer:
- Read marketplace data
- Access own orders
- Access order-related information only

Logistics:
- Access assigned logistics jobs
- Access required pickup/delivery data
- Update only permitted logistics states/events

Admin:
- Broader operational access.

Do not use client-side role checks as the only security layer.

---

# 26. APPLICATION ARCHITECTURE

Expected stack:

## Client
- Expo
- React Native
- TypeScript

## Backend
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage if media/documents are needed
- Edge Functions if secure server-side workflows require them

## State
Use a maintainable strategy such as:
- React Query/TanStack Query for server state, if already present
- lightweight local state/context for UI/session state
- avoid a giant global state store unless necessary

## Navigation
Use Expo-compatible React Navigation / Expo Router according to the current repository setup.

Do not replace the existing routing system without first inspecting it.

---

# 27. SUGGESTED CODE ORGANIZATION

A maintainable structure can look like:

src/
  app/
    navigation/
    providers/
  components/
    ui/
    forms/
    cards/
    feedback/
  features/
    auth/
    roles/
    farmer/
    fpo/
    buyer/
    logistics/
    produce/
    batches/
    marketplace/
    auctions/
    orders/
    notifications/
    profile/
    admin/
  lib/
    supabase/
    storage/
    validation/
    localization/
  hooks/
  types/
  constants/
  utils/

If the current repository uses a different but coherent structure, adapt rather than blindly reorganizing.

---

# 28. TYPESCRIPT REQUIREMENTS

Avoid:
- `any` everywhere
- duplicated interfaces
- status strings scattered through UI
- unvalidated API responses

Prefer:
- shared domain types
- generated Supabase database types if practical
- schema validation at boundaries
- typed navigation
- typed form models

---

# 29. DATA FETCHING

For server data:

- Show loading indicators.
- Handle errors.
- Handle empty states.
- Avoid refetching unnecessarily.
- Invalidate/update cached data after mutations.
- Avoid putting direct Supabase calls in every UI component.

Prefer feature-level data hooks/services.

Example conceptual pattern:

`useBatches()`
`useBatch(id)`
`useCreateBatch()`
`useUpdateBatchStatus()`

rather than embedding queries throughout screen JSX.

---

# 30. FORMS

Forms should:
- Validate inputs
- Show field errors
- Disable submit while saving
- Handle backend errors
- Show success state
- Preserve user input where safe
- Use consistent FarmPrism components

Do not rely solely on client validation for security.

---

# 31. ERROR HANDLING

Every backend mutation should have:
- try/catch or equivalent error boundary
- user-friendly error message
- logging/diagnostic path
- rollback/invalidation strategy where appropriate

Do not expose raw SQL/Postgres errors to users.

---

# 32. OFFLINE / NETWORK RESILIENCE

Agricultural users may have unstable connectivity.

The architecture should be prepared for:
- slow requests
- retries
- temporary network failures
- cached read data where practical
- clear "could not sync" messaging

Do not falsely display a successful server-side operation if the mutation failed.

---

# 33. MEDIA / DOCUMENTS

If future workflows need:
- crop/produce photos
- quality images
- proof of delivery
- organization documents

Use Supabase Storage with proper access policies.

Do not store arbitrary large files directly in database text columns.

---

# 34. LOCATION

Location can be relevant to:
- farm
- FPO
- pickup
- delivery
- logistics routing
- marketplace discovery

Use structured location data where possible.

Do not expose sensitive exact location to users who do not need it.

---

# 35. SECURITY REQUIREMENTS

Never hardcode:
- Supabase service role keys
- private API keys
- secrets
- credentials

Client should use only safe public configuration.

Service-role operations belong on trusted server-side infrastructure.

Use:
- RLS
- least privilege
- input validation
- secure storage
- protected secrets
- safe error messages

---

# 36. EXPO / PREVIEW REQUIREMENTS

A major existing issue was inability to preview the app correctly using Expo.

Codex must verify:

1. `package.json`
2. Expo SDK version
3. React Native version
4. Expo Router / React Navigation compatibility
5. Babel configuration
6. Metro configuration
7. TypeScript configuration
8. app config (`app.json` / `app.config.*`)
9. environment variables
10. native dependency compatibility
11. entry point
12. asset imports
13. fonts
14. icon libraries
15. Supabase client initialization

The app must actually start in Expo.

Avoid installing native dependencies that are incompatible with the current Expo managed workflow unless the project is intentionally configured for them.

---

# 37. ENVIRONMENT VARIABLES

Use Expo-compatible public environment configuration for client-safe values.

Example conceptual variables:

EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY

Never put a Supabase service-role key in the mobile app.

If the current project uses a different environment-variable convention, inspect and standardize it.

---

# 38. PREVIEW DEBUGGING CHECKLIST

If Expo preview fails:

1. Read terminal error.
2. Read Metro bundler error.
3. Check dependency versions.
4. Check import paths/casing.
5. Check missing modules.
6. Check environment variables.
7. Check navigation entry.
8. Check native-only packages.
9. Clear Metro/cache only after understanding the issue.
10. Re-run.
11. Test every major route.

Do not declare success simply because Metro starts; actually navigate through the application.

---

# 39. UI VALIDATION

The target is not merely "app opens."

Validate:
- Splash
- Get Started
- Language selection
- Auth
- Role selection
- Farmer dashboard
- FPO dashboard
- Buyer dashboard
- Logistics dashboard
- Key detail screens
- forms
- navigation
- back behavior
- loading/error states

Compare implementation against the previously supplied screenshots.

---

# 40. NAVIGATION PRINCIPLES

Use a clear navigation hierarchy.

Conceptually:

Root
├── Splash
├── Welcome/Get Started
├── Language
├── Auth
├── Role Selection
└── Authenticated App
    ├── Farmer
    ├── FPO
    ├── Buyer
    ├── Logistics
    └── Admin

Inside each role:
- Dashboard
- Core operations
- Details
- Notifications
- Profile/settings

Exact tab/stack design must follow the approved UI screenshots and current implementation.

---

# 41. FARMER EXPERIENCE — TARGET FLOW

Example target journey:

Splash
→ Get Started
→ Language
→ Login/Signup
→ Farmer role
→ Farmer Dashboard

Dashboard can surface:
- produce overview
- active batches
- sales/orders
- logistics
- notifications
- actions

Farmer workflow:
Dashboard
→ Produce
→ Produce details
→ Produce Activity
→ Physical Batch
→ Batch status
→ Marketplace/sale
→ Order
→ Logistics
→ Delivery/status

The exact number of screens should be determined by UX needs.

---

# 42. FPO EXPERIENCE — TARGET FLOW

Splash
→ Get Started
→ Language
→ Login/Signup
→ FPO role
→ FPO Dashboard

Dashboard can surface:
- member farmers
- aggregated produce
- batches
- marketplace/sales
- orders
- logistics
- notifications

FPO flow:
FPO dashboard
→ Farmers/members
→ Farmer/produce
→ Aggregation
→ Batch/lot
→ Listing/order
→ Logistics
→ Status

---

# 43. BUYER EXPERIENCE — TARGET FLOW

Buyer:
Dashboard
→ Discover marketplace
→ Filter/search produce
→ Produce/listing detail
→ Purchase/bid
→ Order confirmation
→ Order tracking
→ Logistics/delivery
→ Order history

Auction-enabled flow:
Listing
→ Auction
→ Bid
→ Auction result
→ Order/settlement
→ Logistics

---

# 44. LOGISTICS EXPERIENCE — TARGET FLOW

Logistics:
Dashboard
→ Assigned jobs
→ Job detail
→ Pickup information
→ Accept/confirm assignment if required
→ Pickup
→ In Transit
→ Delivered
→ Delivery proof/status
→ Job history

Do not require logistics users to navigate farmer/buyer screens just to perform a logistics action.

---

# 45. DASHBOARDS

Dashboards should not become overloaded.

Use:
- clear greeting/context
- concise KPI/status cards
- primary actions
- recent activity
- pending tasks
- notifications
- quick access

The visual hierarchy should follow the screenshots.

Avoid generic "admin dashboard" styling.

---

# 46. SEARCH / FILTERS

Where lists can grow:
- search
- category filter
- status filter
- date/event filter when relevant
- location filter where appropriate

Filters should be role/domain specific.

---

# 47. AUDITABILITY

Important changes should generate events/audit information.

Examples:
- batch created
- batch status changed
- aggregation performed
- listing created
- bid placed
- order created
- order status changed
- logistics assigned
- pickup completed
- delivery completed

This is important for traceability.

---

# 48. STATUS TRANSITIONS

Centralize business rules.

Example:

Order:
Pending → Confirmed → Processing → Ready for Pickup → In Transit → Delivered

Batch:
Draft → Available → Reserved → Allocated → Sold → Preparing for Pickup → Picked Up → In Transit → Delivered

Logistics:
Pending Assignment → Assigned → Pickup Scheduled → Picked Up → In Transit → Delivered

Do not allow invalid transitions merely because the UI sends a status string.

Prefer server-side validation for critical transitions.

---

# 49. PAYMENTS

Payment architecture was not finalized in the available project decisions.

Therefore:
- Do not invent a payment gateway.
- Keep order/transaction architecture extensible.
- If payment is needed, ask/confirm provider before implementing production payment behavior.

---

# 50. LANGUAGE / LOCALIZATION

Use centralized translation keys.

Avoid:

`<Text>Hardcoded sentence everywhere</Text>`

Prefer:

`t("dashboard.welcome")`

Keep:
- English as baseline
- future Indian language support
- locale selection persisted

Do not hardwire language selection into database authorization.

---

# 51. ACCESSIBILITY

Use:
- accessible labels
- sufficient text size
- touch targets
- semantic buttons
- readable contrast
- not color-only status indicators

---

# 52. PERFORMANCE

Avoid:
- unnecessary full-list re-renders
- repeated database requests
- giant component files
- loading every dataset on dashboard startup

Prefer:
- pagination
- query caching
- lazy loading
- memoization where justified
- optimized images

---

# 53. TESTING

At minimum, build confidence through:

## Static
- TypeScript
- lint
- formatting

## Unit
- validation
- status transition rules
- pure business logic

## Integration
- Supabase data operations
- authorization behavior

## UI / E2E where practical
- authentication
- role restoration
- primary farmer workflow
- buyer order flow
- logistics flow

---

# 54. GIT / REPOSITORY WORKFLOW

Repository:
**FarmPrism**

Known GitHub repository previously provided:
`atharv0906/FarmPrism`

Codex should inspect the repository directly and work against the current branch/state.

Before editing:
- inspect git status
- inspect recent commits
- inspect branches
- inspect README
- inspect package.json
- inspect app structure
- inspect Supabase/migrations if present

Do not assume this document describes every line of the current repository.

---

# 55. CURRENT KNOWN PROBLEM HISTORY

The previous development attempt encountered:

1. Expo preview did not work correctly.
2. UI rendered differently from the supplied reference screenshots.
3. The implementation diverged from the agreed FarmPrism content/flow.
4. There was uncertainty around the database and application integration.
5. Need for a unified app supporting all roles.
6. Need for persistent last-role behavior.
7. Need for clearer FPO responsibilities.
8. Need to clarify Produce Activity.
9. Need to clarify Physical Batch Record.
10. Need to remove Created/Harvest Date.
11. Need to clarify auction rules/time.
12. Need to defer Trust Score until the end.
13. Logistics was confirmed as permanent.
14. The flow was expanded beyond an artificial 18-screen limit.
15. Splash/Welcome and Get Started were explicitly retained.
16. Language selector follows Get Started.

---

# 56. DECISIONS THAT SHOULD NOT BE REVERSED WITHOUT ASKING

These are important:

### Decision A
**One app for all roles.**

### Decision B
**Supported roles include Farmer, FPO, Buyer, Logistics, and Admin.**

### Decision C
**Logistics is permanent.**

### Decision D
**FarmPrism remembers the user's last role and should reopen the corresponding dashboard when possible.**

### Decision E
**Splash/Welcome → Get Started → Language Selector is part of the initial flow.**

### Decision F
**Do not restrict screen count to 18.**

### Decision G
**Physical Batch Record does not include Created/Harvest Date as a field.**

### Decision H
**Trust Score is implemented later, at the end.**

### Decision I
**Produce Activity and Physical Batch Record are different concepts.**

### Decision J
**FPO is an organization/aggregation/coordination role, not just a farmer with a different label.**

### Decision K
**UI must follow the previously supplied reference screenshots, not a generic replacement design.**

---

# 57. IMPORTANT DISTINCTIONS

## Produce vs Produce Activity vs Physical Batch

### Produce
What agricultural product is involved.

### Produce Activity
What operational/agricultural event happened to that produce.

### Physical Batch
What actual physical quantity/lot exists.

Example:

Tomato
→ Produce

"Fertilized on field X"
→ Produce Activity

"300 kg Grade A tomatoes, Batch B123"
→ Physical Batch

---

# 58. IMPORTANT DISTINCTIONS: ORDER VS LOGISTICS

### Order
Commercial relationship between buyer and seller.

### Logistics Job
Physical movement of the ordered goods.

One order may result in:
- one logistics job
- multiple logistics jobs
- multiple batch movements

Do not assume one-to-one forever.

---

# 59. IMPORTANT DISTINCTIONS: ROLE VS ORGANIZATION

A user can be:
- Farmer
- FPO member
- Buyer
- Logistics operator

A role describes what the user can do.

An organization describes which entity they operate under.

Do not overload a single field with both concepts.

---

# 60. RECOMMENDED IMPLEMENTATION ORDER

Codex should work in this order unless the existing project requires a different sequence.

## Phase 1 — Audit
- Inspect repo
- Run app
- Diagnose Expo issue
- Inspect current UI
- Inspect Supabase schema
- Inspect environment config

## Phase 2 — Foundation
- Fix Expo boot
- Fix navigation
- Fix Supabase client
- Fix theme/design tokens
- Establish types

## Phase 3 — Auth/onboarding
- Splash
- Get Started
- Language
- Auth
- Role selection
- Role persistence

## Phase 4 — Role dashboards
- Farmer
- FPO
- Buyer
- Logistics
- Admin

## Phase 5 — Produce
- Produce
- Produce Activity
- Physical Batch
- Batch state

## Phase 6 — FPO aggregation
- Members
- aggregation
- commercial lots/listings

## Phase 7 — Marketplace
- listings
- discovery
- buying
- auction if enabled

## Phase 8 — Orders
- create/manage orders
- order status
- order history

## Phase 9 — Logistics
- job creation/assignment
- pickup
- transit
- delivery
- events

## Phase 10 — Notifications
- event-driven notification UX

## Phase 11 — Hardening
- RLS
- validation
- errors
- loading/empty states
- tests
- performance

## Phase 12 — Trust Score
Only after core product is stable.

---

# 61. CODEX EXECUTION RULES

When asked to fix something:

1. Reproduce it.
2. Identify the root cause.
3. Make the smallest coherent change.
4. Run typecheck/lint/tests where available.
5. Run Expo.
6. Test affected screens.
7. Check for regressions.
8. Report exactly what changed.

Do not say "fixed" based only on code inspection.

---

# 62. DO NOT DO THESE THINGS

Do not:
- replace the approved UI with generic cards
- create a second unrelated app for logistics
- hardcode fake database records as the final solution
- put secrets in Expo client code
- trust client-only role checks
- merge Produce Activity and Physical Batch
- restore Created/Harvest Date as a batch field
- make Trust Score a dependency now
- limit the app to exactly 18 screens
- create unexplained auction fields
- duplicate role-specific implementations unnecessarily
- introduce a completely new stack without need
- destroy existing migrations/data without a migration plan
- rewrite the whole app before inspecting it
- claim Expo works without actually running it

---

# 63. DEFINITION OF DONE — FOUNDATION

Foundation is done when:

- Expo starts
- app loads on supported target
- no obvious Metro/import errors
- Supabase client initializes safely
- auth/session architecture works
- navigation works
- role restoration works
- initial onboarding flow works
- reference UI direction is represented consistently

---

# 64. DEFINITION OF DONE — MVP

MVP should support:

- Authentication
- Role selection/restoration
- Farmer workflow
- FPO workflow
- Buyer workflow
- Permanent logistics workflow
- Produce
- Produce Activity
- Physical Batches
- Marketplace/listings
- Orders
- Logistics jobs/events
- Notifications
- Supabase persistence
- RLS
- Loading/error/empty states

Trust Score can remain deferred.

---

# 65. DEFINITION OF DONE — QUALITY

Before considering FarmPrism ready:

- No major TypeScript errors
- No obvious navigation dead ends
- No broken critical flows
- No client-side secrets
- RLS verified
- Data relationships validated
- Status transitions validated
- Expo preview works
- UI matches reference direction
- Core screens have loading/error/empty states
- No critical mock data remains where real backend data is expected

---

# 66. UI REFERENCE HANDLING

The original project conversation contains the actual UI reference screenshots.

Codex may not automatically have those screenshots unless they are present in the repository or attached to the Codex context.

If the screenshots are available:
- use them as the visual source of truth.

If they are not available:
- inspect the existing implementation and repository assets first;
- do not invent a completely different design;
- if pixel-level recreation is required and the screenshots are unavailable, request the reference screenshots from the user rather than guessing.

---

# 67. EXPECTED CODEX FIRST RESPONSE / FIRST ACTION

When taking over this project, start with an audit, not a rewrite.

Suggested first-pass actions:

```text
1. git status
2. inspect repository tree
3. inspect package.json
4. inspect Expo/app configuration
5. inspect navigation
6. inspect existing screens/components
7. inspect Supabase client/config
8. inspect Supabase migrations/schema
9. inspect environment variable usage
10. run the application
11. reproduce the Expo/preview issue
12. identify UI divergence
13. produce a concise diagnosis
14. then begin fixes
```

After diagnosis, make changes in coherent increments.

---

# 68. REFERENCE DOMAIN FLOW

The intended end-to-end business flow is approximately:

```text
                 ┌───────────────┐
                 │    Farmer     │
                 └───────┬───────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Produce Activity│
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Physical Batch  │
                └────────┬────────┘
                         │
                  aggregation
                         │
                         ▼
                ┌─────────────────┐
                │       FPO       │
                └────────┬────────┘
                         │
                    listing/sale
                         │
                         ▼
                ┌─────────────────┐
                │ Buyer / Auction │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │      Order      │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Logistics Job   │
                └────────┬────────┘
                         │
                 pickup / transit
                         │
                         ▼
                ┌─────────────────┐
                │    Delivery     │
                └─────────────────┘
```

Traceability should preserve the links through the entire chain.

---

# 69. ROLE-BASED APP FLOW

```text
Launch
  ↓
Splash / Welcome
  ↓
Get Started
  ↓
Language Selector
  ↓
Authentication
  ↓
Load User + Roles
  ↓
┌─────────────────────────────────────────────┐
│ Has one role? → open role dashboard         │
│ Has multiple roles?                         │
│   ├─ last role valid → restore it           │
│   └─ otherwise → role selection             │
└─────────────────────────────────────────────┘
  ↓
Active Role Dashboard
  ↓
Role-specific workflows
```

---

# 70. DATA FLOW

```text
React Native / Expo UI
        │
        ▼
Feature hooks/services
        │
        ▼
Supabase client
        │
        ├── Supabase Auth
        │
        ├── PostgreSQL
        │      ├── profiles
        │      ├── roles/orgs
        │      ├── produce
        │      ├── activities
        │      ├── batches
        │      ├── listings/auctions
        │      ├── orders
        │      ├── logistics
        │      └── notifications
        │
        ├── Storage
        │
        └── Edge Functions (when secure server-side logic is needed)
```

---

# 71. DATABASE TRACEABILITY FLOW

```text
User
 ↓
Farmer/FPO
 ↓
Produce
 ↓
Produce Activity
 ↓
Physical Batch
 ↓
Aggregation relationship
 ↓
Listing / Auction
 ↓
Order
 ↓
Order Item
 ↓
Logistics Job
 ↓
Logistics Events
 ↓
Delivery
```

This chain is one of the most important architectural concepts in FarmPrism.

---

# 72. FUTURE EXTENSIONS

The architecture should remain open for:

- payments
- advanced auction rules
- quality certification
- document verification
- GPS/logistics optimization
- richer FPO management
- analytics
- market price intelligence
- farmer financial services
- trust score/reputation
- dispute management
- advanced notification channels

Do not build these prematurely.

---

# 73. PRODUCT LANGUAGE

Use clear, practical language.

Prefer:
- Produce
- Batch
- Order
- Pickup
- Delivery
- FPO
- Buyer
- Farmer
- Logistics

Avoid overly technical terminology in user-facing UI.

---

# 74. CURRENT PRIORITY

The immediate engineering priority is:

### Priority 1
Make the existing FarmPrism app reliably previewable/runable in Expo.

### Priority 2
Bring the UI back in line with the approved reference screenshots.

### Priority 3
Ensure the navigation/onboarding/role architecture follows the agreed product decisions.

### Priority 4
Connect the application cleanly to the FarmPrism Supabase backend.

### Priority 5
Implement the core business domains in a stable sequence.

### Priority 6
Implement Trust Score last.

---

# 75. FINAL HANDOFF SUMMARY

FarmPrism is a unified, mobile-first agricultural platform.

It has:
- Farmer
- FPO
- Buyer
- Logistics
- Admin

It uses:
- Expo
- React Native
- TypeScript
- Supabase/PostgreSQL/Auth

The central business chain is:

**Farmer → Produce Activity → Physical Batch → FPO/Aggregation → Marketplace/Auction → Buyer → Order → Logistics → Delivery**

The app:
- starts with Splash/Welcome
- then Get Started
- then Language Selector
- then authentication
- then role-aware routing
- remembers the last role
- provides a single application for all roles
- treats logistics as permanent
- separates Produce Activity from Physical Batch
- excludes Created/Harvest Date from the physical batch record
- defers Trust Score until the end
- is not constrained to 18 screens
- must visually follow the supplied reference screenshots
- must work correctly in Expo
- must use Supabase securely with RLS

**Do not rewrite blindly. Audit first, reproduce the current problems, then fix the repository incrementally.**

---

# 76. NOTE ON SOURCE OF TRUTH

This handoff consolidates the product/architecture decisions established in the FarmPrism project discussions. The actual repository remains the source of truth for implementation details such as:
- exact current file names
- current routes
- existing migrations
- existing components
- dependency versions
- environment setup
- already implemented functionality

Where this specification conflicts with obsolete code, prefer this specification for product decisions but preserve compatible existing implementation.

Where the specification and a newer explicit user instruction conflict, the newer explicit user instruction wins.
