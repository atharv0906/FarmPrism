# FarmPrism — My Farm Page
## Detailed UX Action & Navigation Handoff v3.0

**Platform:** React Native / Expo  
**Target:** Android-first mobile application  
**Visual reference:** 1080 × 2340 px (9:19.5)

---

# 1. Purpose of My Farm

**My Farm** is the farmer's personal farm-information and produce context area.

Its core question is:

> **"What do I have?"**

It contains:

- Farm overview
- Farmer's crops
- Available produce
- Crop details
- Farm activities, where used
- Farm location
- Farm information editing

My Farm should not become a second Sell page or a complex agricultural-management system.

The relationship between the main Farmer modules is:

```text
MY FARM
What I have
      ↓
INSIGHTS
What it is worth / what is happening
      ↓
SELL
How I can sell it
      ↓
ORDERS
What I sold
```

---

# 2. Bottom Navigation

The Farmer app uses:

```text
┌────────┬──────────┬────────┬──────────┬─────────┐
│  Home  │ My Farm  │  Sell  │ Insights │ Profile │
└────────┴──────────┴────────┴──────────┴─────────┘
             ↑
          Selected
```

Do not add:

```text
Crops
Produce
Market
Orders
Location
```

as bottom-navigation tabs.

They are destinations within the appropriate module.

---

# 3. Complete My Farm Action Map

```text
MY FARM
│
├── Farm Overview
│      ├── Edit Farm → Edit Farm Details
│      ├── Crops metric → My Crops
│      ├── Land metric → Farm Details
│      ├── Available Produce → Available Produce
│      └── Location → Farm Location
│
├── My Crops
│      ├── View All → My Crops
│      ├── Crop Card → Crop Details
│      ├── Add New Crop → Add Crop
│      └── Crop Actions
│             ├── View Details
│             ├── Edit Crop
│             └── View Produce
│
├── Farm Activities
│      ├── View All → Farm Activities
│      ├── View Crops → My Crops
│      └── View Updates → Farm Activities / Updates
│
├── Farm Location
│      ├── View on Map → Map
│      └── View Full Map → Map
│
├── Brand Banner
│      └── Non-clickable
│
└── Bottom Navigation
       ├── Home
       ├── My Farm
       ├── Sell
       ├── Insights
       └── Profile
```

---

# 4. Header

The My Farm header contains:

```text
FarmPrism logo
Notification bell

My Farm

Manage your land, crops
and produce in one place.

Location
Edit Farm
```

---

# 5. FarmPrism Logo

Recommended behavior:

```text
Tap logo
   ↓
No navigation
```

The logo is branding.

Do not use it as an unexpected navigation shortcut.

---

# 6. Notification Bell

Same global behavior as Home.

```text
My Farm
 ↓
Notifications
```

Individual notifications can deep-link to:

```text
New Offer → Offer Details
Pickup Scheduled → Order Details
Market Update → Insights
Farm/Profile update → Relevant details
```

Opening a notification marks it as read.

---

# 7. Farm Location

Example:

```text
📍 Wagholi, Pune, Maharashtra
```

The location shown in the header is a summary of the farmer's saved farm location.

### Tap behavior

Recommended:

```text
Tap location
 ↓
Farm Location
```

This should show the saved farm location.

Do not automatically launch external maps just from the small header location unless that behavior is explicitly required.

---

# 8. Edit Farm

Current action:

```text
Edit Farm
```

### Destination

```text
Edit Farm Details
```

The farmer can update farm-level information such as:

```text
State
District
Taluka / Tehsil
Village
Farm Size
Farm Location
```

Only fields that the existing FarmPrism data model supports should be displayed.

### Save flow

```text
Edit Farm
 ↓
Change details
 ↓
Save Changes
 ↓
Validation
 ↓
Farm updated
 ↓
My Farm
```

Success message:

```text
Farm details updated successfully.
```

---

# 9. Farm Overview

The overview answers:

> **What does my farm currently contain?**

Example:

```text
Farm Overview

5.0 Acres
Total Land

2 Crops
You Grow

12 Quintals
Available to Sell

Drip
Primary Irrigation Method
```

Important:

The overview should contain only information that is actually available in the farmer's profile/farm data.

Do not invent values.

---

# 10. Farm Overview — Crops Metric

Example:

```text
2
Crops
You Grow
```

### Recommended action

```text
Tap
 ↓
My Crops
```

This gives the farmer a direct view of their crop list.

---

# 11. Farm Overview — Acres Metric

Example:

```text
5.0
Acres
Total Land
```

### Recommended behavior

This can be informational.

If interactive:

```text
Tap
 ↓
Farm Details / Edit Farm
```

Do not create a separate duplicate "Land" page.

The canonical source is the farm details.

---

# 12. Farm Overview — Available Produce

Example:

```text
12
Quintals
Available to Sell
```

### Action

```text
Tap
 ↓
Available Produce
```

This shows produce currently available from the farmer's crops.

Example:

```text
Available Produce

Tomato
12 Quintals
Ready to Sell

Onion
10 Quintals
Expected / Available
```

---

# 13. Available Produce → Sell

If the farmer wants to sell a specific available produce item:

```text
Available Produce
 ↓
Tomato
 ↓
Sell This Produce
 ↓
Sell → Create Listing
```

The Sell flow should open with Tomato preselected.

Do not duplicate the listing form inside My Farm.

---

# 14. My Crops

Example:

```text
My Crops

Tomato
Active

2.5 Acres
12 Quintals
Expected Yield

Onion
Active

2.5 Acres
10 Quintals
Expected Yield
```

The list is farmer-specific.

Never assume every farmer grows:

```text
Tomato
Onion
Potato
```

The prototype may use these crops, but production data must come from the farmer's crop records.

---

# 15. View All Crops

Current action:

```text
View All →
```

### Destination

```text
My Crops
```

This is the canonical crop list.

Do not create another crop list specifically for the My Farm home page.

---

# 16. Crop Card

Example:

```text
Tomato
Active

2.5 Acres
Area Cultivated

12 Quintals
Expected Yield

Harvesting
Nov 2025

[ View Details → ]
```

### Tap card

```text
Crop Details
```

The crop detail screen is the canonical destination for that crop.

---

# 17. Crop Details

Recommended information:

```text
Crop Name
Area
Expected Yield
Available Produce
Expected Availability
Crop status
Relevant dates
Previous sales
Market information shortcut
```

Do not make crop details a complex farm-health dashboard.

The purpose is to understand the farmer's produce context.

---

# 18. Crop Details → Market

The farmer may want to know what the crop is worth.

Example:

```text
Crop Details
 ↓
Current Market Price
```

### Destination

```text
Insights → Crop Market Details
```

Do not create a separate Market page under My Farm.

---

# 19. Crop Details → Sell

If produce is available:

```text
Crop Details
 ↓
Sell Produce
 ↓
Sell → Create Listing
```

The crop should be preselected.

Example:

```text
Create Listing

Produce:
Tomato ✓
```

---

# 20. Crop Details → Buyer Interest

If the farmer has active produce/listings:

```text
Crop Details
 ↓
Buyer Interest
 ↓
Sell → Buyer Offers
```

This allows the farmer to move from:

```text
What I have
     ↓
Who wants it
```

without duplicating buyer functionality.

---

# 21. Crop Details → Previous Sales

If selling history exists:

```text
Crop Details
 ↓
Previous Sales
```

The farmer can see previous transactions related to that crop.

If no sales exist:

```text
No sales for this crop yet.
```

A future action may be:

```text
View Selling History
```

which leads to:

```text
Sell → Selling History
```

---

# 22. Add New Crop

Current action:

```text
+ Add New Crop
```

### Destination

```text
Add Crop
```

This is a form.

Recommended fields:

```text
Crop
Area
Sowing / planting information if required
Expected harvest / availability
Expected quantity
```

Only collect fields that are actually needed by FarmPrism.

Do not turn Add Crop into a long agricultural questionnaire.

---

# 23. Add Crop Flow

```text
My Farm
 ↓
Add New Crop
 ↓
Select Crop
 ↓
Enter Crop Details
 ↓
Review
 ↓
Save Crop
 ↓
Success
 ↓
My Farm / My Crops
```

Success:

```text
Crop added successfully.

[ View Crop ]
[ Back to My Farm ]
```

---

# 24. Crop Editing

From Crop Details:

```text
Crop Details
 ↓
Edit Crop
 ↓
Change information
 ↓
Save
 ↓
Crop Details
```

Only editable fields should be shown.

If changing a value affects available produce/listings, the backend must validate the change.

---

# 25. Crop Deletion / Removal

If the product allows crop removal:

```text
Crop Details
 ↓
More
 ↓
Remove Crop
```

If the crop has:

- active produce
- active listings
- pending offers
- orders

do not simply delete it.

The backend should enforce the appropriate business rule.

A safer MVP option is:

```text
Mark Crop Inactive
```

instead of hard deletion.

---

# 26. Farm Activities

The existing My Farm design includes:

```text
Farm Activities
```

This section should remain lightweight.

It can represent farm-related records such as:

```text
Crop Added
Farm Updated
Crop Information Updated
Produce Added / Updated
```

It should not become a full farm-management diary unless that is explicitly added to the product scope.

---

# 27. Farm Activities — View All

Current:

```text
View All →
```

### Destination

```text
Farm Activities
```

Example:

```text
Farm Activities

12 Aug
Tomato crop updated

08 Aug
Onion crop added

01 Aug
Farm details updated
```

Keep it chronological.

---

# 28. Crops Added

Example:

```text
2
Crops Added

View Crops →
```

### Destination

```text
My Crops
```

This is a shortcut, not a separate feature.

---

# 29. Update This Month

Example:

```text
1
Update This Month

View Updates →
```

### Destination

```text
Farm Activities / Updates
```

It should show relevant farm changes.

Do not create an unnecessary analytics dashboard.

---

# 30. Farm Photos

If Farm Photos are part of the current product:

```text
0
Farm Photos

Add Photos →
```

### Destination

```text
Farm Photos
```

The farmer can add/view photos.

If farm photos are not required by the current backend/product scope, this card can be removed rather than implemented as a fake feature.

---

# 31. Farm Location Section

The detailed section can show:

```text
Farm Location

Wagholi, Pune
Maharashtra, India

5.0 Acres
Total Land Area

[ View Full Map → ]
```

---

# 32. View on Map

### Action

```text
View on Map →
```

### Destination

```text
Farm Location / Map
```

The screen should show the saved farm location.

Possible features:

```text
Map
Farm marker
Location name
Area information
```

---

# 33. View Full Map

### Action

```text
View Full Map →
```

### Destination

```text
Farm Location Map
```

If an external mapping application is intentionally supported, the developer may provide an explicit secondary action such as:

```text
Open in Maps
```

Do not automatically launch an external application from every map tap.

---

# 34. Farm Location Editing

If the farmer needs to change location:

```text
Farm Location
 ↓
Edit Location
 ↓
Select / confirm location
 ↓
Save
 ↓
My Farm
```

The exact GPS/location implementation depends on the existing FarmPrism technical requirements.

Do not silently change the saved farm location.

---

# 35. Bottom Navigation

## Home

```text
Tap Home
 ↓
Home
```

Canonical meaning:

> What matters today.

---

## My Farm

```text
Tap My Farm
 ↓
My Farm
```

If already on My Farm:

```text
Tap My Farm
 ↓
Scroll to top
```

---

## Sell

```text
Tap Sell
 ↓
Sell
```

Canonical meaning:

> What I can sell.

---

## Insights

```text
Tap Insights
 ↓
Insights
```

Canonical meaning:

> What it is worth / market information.

---

## Profile

```text
Tap Profile
 ↓
Profile
```

Canonical meaning:

> My account and settings.

---

# 36. Brand Banner

The bottom FarmPrism banner is primarily decorative branding.

Recommended:

```text
NON-CLICKABLE
```

Do not create a navigation destination for it.

---

# 37. Canonical Destination Table

| My Farm element | Action | Destination |
|---|---|---|
| Logo | Tap | No navigation |
| Notification | Tap | Notifications |
| Header location | Tap | Farm Location |
| Edit Farm | Tap | Edit Farm Details |
| View farm details | Tap | My Farm / Farm Overview |
| Crops metric | Tap | My Crops |
| Acres metric | Optional | Farm Details / Edit Farm |
| Available quantity | Tap | Available Produce |
| View All Crops | Tap | My Crops |
| Crop card | Tap | Crop Details |
| View Details | Tap | Crop Details |
| Add New Crop | Tap | Add Crop |
| Edit Crop | Tap | Edit Crop |
| View Produce | Tap | Available Produce |
| Market Price | Tap | Insights → Crop Market Details |
| Buyer Interest | Tap | Sell → Buyer Offers |
| Previous Sales | Tap | Sell → Selling History / Crop Sales |
| Farm Activities View All | Tap | Farm Activities |
| View Crops | Tap | My Crops |
| View Updates | Tap | Farm Activities / Updates |
| Farm Photos | Tap | Farm Photos, if enabled |
| View on Map | Tap | Farm Location / Map |
| View Full Map | Tap | Farm Location / Map |
| Banner | Tap | No navigation |
| Bottom Home | Tap | Home |
| Bottom My Farm | Tap | My Farm |
| Bottom Sell | Tap | Sell |
| Bottom Insights | Tap | Insights |
| Bottom Profile | Tap | Profile |

---

# 38. My Farm → Insights

Important cross-module paths:

```text
My Farm
 ↓
Crop Details
 ↓
Market Price
 ↓
Insights
```

or:

```text
My Farm
 ↓
Crop Details
 ↓
Price Prediction
 ↓
Insights
```

The farmer is moving from:

```text
What I have
```

to:

```text
What it is worth
```

---

# 39. My Farm → Sell

Primary transaction path:

```text
My Farm
 ↓
Available Produce
 ↓
Select Produce
 ↓
Sell This Produce
 ↓
Create Listing
```

This is preferable to creating a second listing workflow inside My Farm.

---

# 40. My Farm → Buyer Offers

If a crop has buyer interest:

```text
My Farm
 ↓
Crop Details
 ↓
Buyer Interest
 ↓
Buyer Offers
```

The Buyer Offers screen should be the same canonical screen used by:

```text
Home → Top Opportunity → View Offers
Sell → Buyer Offers
Insights → Buyer Interest
```

Only the initial filter/context changes.

---

# 41. My Farm → Selling History

If the farmer wants to understand previous sales:

```text
Crop Details
 ↓
Previous Sales
 ↓
Sell → Selling History
```

Do not create separate histories inside every crop.

Use one canonical Selling History destination with crop filtering.

---

# 42. Data Ownership

My Farm should primarily read from:

```text
Farmer
Farm
Crop
Produce
Farm Activity
Farm Location
```

It can link to:

```text
Market Price
Price Prediction
Buyer Interest
Selling History
```

but these should remain owned by their respective modules/services.

---

# 43. Suggested My Farm Data Model

```ts
type Farm = {
  id: string;
  farmerId: string;
  state?: string;
  district?: string;
  taluka?: string;
  village?: string;
  areaAcres?: number;
  location?: {
    latitude: number;
    longitude: number;
    label?: string;
  };
  primaryIrrigationMethod?: string;
};

type Crop = {
  id: string;
  farmId: string;
  cropName: string;
  areaAcres?: number;
  status?: "active" | "inactive";
  expectedYield?: number;
  yieldUnit?: string;
  expectedAvailability?: string;
  notes?: string;
};

type Produce = {
  id: string;
  cropId: string;
  availableQuantity: number;
  unit: string;
  status: "available" | "listed" | "partially_sold" | "sold";
};
```

Adapt these to the existing FarmPrism schema.

---

# 44. Navigation Context

When navigating from My Farm, preserve context.

Example:

```text
My Crops
 ↓
Tomato
 ↓
Market Price
```

should open:

```text
Tomato Market Details
```

not a generic market page.

Likewise:

```text
Tomato
 ↓
Sell This Produce
```

should open:

```text
Create Listing
```

with:

```text
cropId = Tomato
```

already selected.

---

# 45. Back Navigation

### My Farm → Crop Details

```text
Back → My Farm
```

### Crop Details → Insights

```text
Back → Crop Details
```

### Crop Details → Sell

```text
Back → Crop Details
```

The navigation stack should reflect the actual journey.

Do not force every back action directly to My Farm.

---

# 46. Unsaved Form Protection

For Add Crop / Edit Crop:

If no changes were made:

```text
Back → Previous screen
```

If changes were made:

```text
Discard changes?

[ Stay ]
[ Discard ]
```

Do not show a confirmation unnecessarily.

---

# 47. Loading States

Use skeletons for:

```text
Farm Overview
Crop cards
Available produce
Farm activities
Location
```

Do not show fake values while loading.

Bad:

```text
5.0 Acres
0 Crops
₹0
```

unless these are actual returned values.

---

# 48. Empty States

## No crops

```text
No crops added yet.

Add your first crop to keep
your farm information organized.

[ Add Crop ]
```

## No available produce

```text
No produce is currently available.

Your available produce will appear here.
```

## No activities

```text
No farm activity yet.

Updates to your farm and crops
will appear here.
```

## No farm photos

```text
No farm photos yet.

[ Add Photos ]
```

Only display this if Farm Photos is part of the enabled product scope.

---

# 49. Error States

Example:

```text
We couldn't load your farm details.

Please check your connection
and try again.

[ Try Again ]
```

For a crop-specific error:

```text
We couldn't load this crop.

[ Try Again ]
```

One failed section should not necessarily make the entire My Farm screen unusable.

---

# 50. Offline Behavior

Where possible:

- Display cached farm information.
- Show last updated time for data that can become stale.
- Clearly distinguish cached information from current information.
- Retry when connectivity returns.

Farm identity/details are generally less time-sensitive than market prices.

---

# 51. Animation

Keep animation consistent with Home and Sell.

### Screen entry

```text
250–300ms
Fade + slight upward movement
```

### Crop cards

Optional:

```text
40–60ms stagger
```

### Add Crop success

```text
250–400ms
Checkmark / success transition
```

### Button press

```text
100–150ms
scale ≈ 0.97
```

Avoid:

```text
Bouncing cards
Continuous landscape animation
Moving leaves
Heavy parallax
Long transitions
```

---

# 52. Accessibility

Minimum interactive target:

**48 × 48 dp-equivalent**

Requirements:

- Icon-only buttons need accessible labels.
- Crop cards need clear accessible names.
- Location actions need meaningful labels.
- Do not communicate status using color alone.
- Support larger text.
- Avoid clipping crop names, quantities or dates.
- Decorative artwork should be ignored by screen readers.
- User-facing strings should be localization-ready.

---

# 53. Responsive Design

Visual reference:

```text
1080 × 2340 px
```

Runtime must not use fixed 1080×2340 dimensions.

Use:

- Flexbox
- `useWindowDimensions()`
- Safe-area handling
- ScrollView / FlatList
- Responsive card widths

Recommended starting tokens:

```text
Horizontal padding: 20–24dp
Card radius: 16–20dp
Touch target: ≥48dp
Section gap: 16–24dp
Card padding: 16–20dp
```

Use the visual reference to refine exact geometry.

---

# 54. Security / Authorization

Backend must ensure:

- Farmer can only access their own farm.
- Farmer can only modify their own farm.
- Farmer can only modify their own crops.
- Produce belongs to the farmer's crop/farm.
- Farm location updates are authorized.
- Historical sales shown from My Farm belong to the authenticated farmer.

Do not trust farmer IDs, crop IDs or farm IDs supplied by the client without server authorization.

---

# 55. Business Rules

## Crop ownership

```text
Crop.farmId must belong to authenticated farmer.
```

## Produce quantity

Available produce should reconcile with:

```text
Produce
- active listings
- sold quantity
```

The exact inventory calculation should be controlled by backend business logic.

## Active listing

A crop/produce should not be presented as freely available if its quantity is already committed to an active transaction.

## Crop removal

Do not hard-delete a crop with active commercial relationships.

Use an appropriate inactive/archive state.

## Market information

Market prices displayed from Crop Details should come from the same canonical Insights/Market service.

---

# 56. Suggested React Native Structure

```text
src/
├── screens/
│   └── farmer/
│       ├── MyFarmScreen.tsx
│       ├── MyCropsScreen.tsx
│       ├── CropDetailsScreen.tsx
│       ├── AddCropScreen.tsx
│       ├── EditCropScreen.tsx
│       ├── AvailableProduceScreen.tsx
│       ├── FarmActivitiesScreen.tsx
│       ├── FarmLocationScreen.tsx
│       └── FarmPhotosScreen.tsx
│
├── components/
│   └── myFarm/
│       ├── FarmOverviewCard.tsx
│       ├── CropCard.tsx
│       ├── AddCropCard.tsx
│       ├── FarmActivitiesCard.tsx
│       ├── FarmLocationCard.tsx
│       └── FarmBanner.tsx
│
├── services/
│   ├── farmService.ts
│   ├── cropService.ts
│   ├── produceService.ts
│   └── farmActivityService.ts
│
└── models/
    ├── farm.ts
    ├── crop.ts
    ├── produce.ts
    └── farmActivity.ts
```

Adapt to the existing FarmPrism architecture.

---

# 57. Performance

- Load the farm summary quickly.
- Use FlatList for long crop/activity lists.
- Avoid loading full crop histories on the main My Farm screen.
- Lazy-load detailed screens.
- Cache stable farm information.
- Compress artwork.
- Avoid unnecessary API requests for cards that can share one response.

---

# 58. Final Canonical Architecture

```text
                         MY FARM
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
   FARM OVERVIEW         MY CROPS        AVAILABLE PRODUCE
        │                   │                   │
        │                   ▼                   ▼
        │             CROP DETAILS          SELL
        │                   │                   │
        │          ┌────────┼────────┐          │
        │          │        │        │          │
        │          ▼        ▼        ▼          │
        │       INSIGHTS   SELL   SALES         │
        │          │        │      HISTORY      │
        │          │        │        │          │
        └──────────┴────────┴────────┴──────────┘
                            │
                            ▼
                      OTHER MODULES
```

The key relationship is:

```text
MY FARM
What I have
     ↓
INSIGHTS
What it is worth
     ↓
SELL
How I can sell it
```

---

# 59. Final UX Principle

My Farm should feel like a **simple digital record of the farmer's farm**, not a complicated farm-management system.

The farmer should be able to understand:

```text
WHAT DO I HAVE?
      ↓
WHICH CROPS DO I HAVE?
      ↓
HOW MUCH PRODUCE IS AVAILABLE?
      ↓
WHAT IS THIS PRODUCE WORTH?
      ↓
DO I WANT TO SELL IT?
```

The next action should always move to the correct canonical module.

**My Farm owns farm/crop information.**

**Insights owns market intelligence.**

**Sell owns listings and buyer transactions.**

**Orders owns completed sales and delivery/payment status.**

This separation prevents duplicate screens, duplicate data and confusing navigation.
