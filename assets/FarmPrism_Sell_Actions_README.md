# FarmPrism — Farmer Sell Page
## Detailed UX Action & Navigation Handoff v3.0

**Platform:** React Native / Expo  
**Target:** Android-first mobile application  
**Visual reference:** 1080 × 2340 px (9:19.5)

---

# 1. Purpose of Sell

**Sell** is the farmer's commercial action center.

Its core question is:

> **"How can I sell my produce directly, transparently and at a better value?"**

Sell owns:

- Creating produce listings
- Quality information
- Selling method
- Active listings
- Buyer opportunities
- Buyer offers
- Offer comparison
- Offer acceptance
- Selling history

Sell does **not** own:

- Farm profile → My Farm
- Market intelligence → Insights
- Delivery execution → Logistics
- Payment processing → Orders / payment flow

The main product loop is:

```text
PRODUCE
   ↓
QUALITY
   ↓
MARKET PRICE
   ↓
PRICE PREDICTION
   ↓
BUYER OPPORTUNITIES
   ↓
OFFERS
   ↓
COMPARE
   ↓
ACCEPT
   ↓
ORDER
   ↓
LOGISTICS
   ↓
PAYMENT
```

---

# 2. Bottom Navigation

```text
┌────────┬──────────┬────────┬──────────┬─────────┐
│  Home  │ My Farm  │  Sell  │ Insights │ Profile │
└────────┴──────────┴────────┴──────────┴─────────┘
                        ↑
                     Selected
```

Sell is the third primary module.

Do not add separate bottom tabs for:

```text
Listings
Buyers
Offers
Orders
History
```

These remain inside the Sell / transaction flow.

---

# 3. Sell Page Mental Model

The farmer should immediately understand:

```text
WHAT CAN I SELL?
      ↓
WHAT IS IT WORTH?
      ↓
WHO WANTS IT?
      ↓
WHAT ARE THEY OFFERING?
      ↓
WHICH OFFER IS BETTER?
      ↓
ACCEPT
```

---

# 4. Complete Sell Action Map

```text
SELL
│
├── Create Listing
│      ├── Select Produce
│      ├── Quantity
│      ├── Quality
│      ├── Photos
│      ├── Market Price
│      ├── Price Prediction
│      ├── Selling Method
│      ├── Review
│      └── Publish
│
├── My Listings
│      ├── Active Listing
│      ├── Listing Details
│      ├── Edit Listing
│      ├── Pause/Close Listing
│      └── View Offers
│
├── Buyer Opportunities
│      └── Buyer Offers
│
├── Buyer Offers
│      ├── Offer Details
│      ├── Compare Offers
│      └── Accept Offer
│
├── Selling History
│      └── Sale Details
│
└── Bottom Navigation
       ├── Home
       ├── My Farm
       ├── Sell
       ├── Insights
       └── Profile
```

---

# 5. Sell Home Screen

Recommended hierarchy:

```text
Header
↓
What would you like to sell?
↓
Available Produce
↓
Primary CTA: List Produce
↓
Active Listings
↓
New Buyer Offers
↓
Buyer Opportunities
↓
Selling History
```

The exact visual arrangement can follow the approved Sell page reference.

---

# 6. Header

Recommended:

```text
FarmPrism logo
Notification bell

Sell Your Produce

Sell directly.
Compare offers.
Get better value.
```

The wording should remain simple.

---

# 7. Notification Bell

Same global behavior as Home and My Farm.

```text
Tap
 ↓
Notifications
```

Deep links:

```text
New offer → Offer Details
Listing update → Listing Details
Order update → Order Details
Payment → Payment Details
Market alert → Insights
```

---

# 8. Primary Action — List Produce

This is the main Sell CTA.

```text
[ List Produce ]
```

### Destination

```text
Create Listing
```

This must start the actual selling flow.

---

# 9. Create Listing — Step 1

## Select Produce

The farmer chooses from available produce.

Example:

```text
What do you want to sell?

🍅 Tomato
🧅 Onion
🥔 Potato
```

Only show crops/produce associated with the farmer.

Do not assume every farmer has all three.

---

# 10. Select Produce → Next

```text
Select Produce
 ↓
Quantity
```

The selected crop must remain attached to the listing state.

Example:

```text
cropId = tomato
```

Do not require the farmer to select Tomato again later.

---

# 11. Quantity

Example:

```text
How much do you want to sell?

[ 10 ] Quintals

Available:
12 Quintals
```

Validation:

```text
quantity > 0
quantity <= available quantity
```

If quantity exceeds available stock:

```text
You only have 12 Quintals available.
```

Do not allow the listing to proceed until valid.

---

# 12. Quality Information

Quality Assurance is an important part of the FarmPrism selling journey.

The farmer should provide simple quality information.

Example:

```text
Quality

Grade:
○ A
○ B
○ C

Condition:
Fresh

Photos:
[ Add Photos ]
```

Use only the grading structure actually supported by the business/backend.

---

# 13. Quality Status

Never call farmer-declared quality:

```text
FarmPrism Verified
```

unless FarmPrism actually verified it.

Use clear labels:

```text
Farmer Declared
```

or, where applicable:

```text
FarmPrism Verified
```

or:

```text
Buyer Accepted
```

These are different states.

---

# 14. Produce Photos

The farmer may add produce photos.

Purpose:

- Help buyers evaluate visible quality
- Improve listing transparency
- Support future quality-assessment functionality

The app should not claim that a photo is scientifically grading the crop unless such a validated system actually exists.

If AI assistance is added later, label it:

```text
AI-assisted quality assessment
```

rather than:

```text
Certified quality
```

unless formally certified.

---

# 15. Market Price

After quality/quantity:

```text
Current Market Price

Tomato
₹2,400 / Quintal

Mandi Reference
₹2,350 / Quintal
```

This is information for the farmer.

The app should not force a selling price.

---

# 16. Price Prediction

Example:

```text
FarmPrism Price Prediction

₹2,500 – ₹2,650 / Quintal

Possible trend:
↑ Prices may improve

Next 7 days
```

The prediction must be clearly labeled as a prediction.

Never say:

```text
You will get ₹2,650
```

Prefer:

```text
Possible range:
₹2,500–₹2,650
```

---

# 17. Selling Method

Depending on the finalized FarmPrism business rules:

```text
How do you want to sell?

○ Direct Buyer Offer
○ Auction
```

If the product uses only direct buyer selling in MVP, show only:

```text
Direct Buyer
```

Do not create unused functionality.

---

# 18. Direct Buyer Listing

Recommended flow:

```text
Produce
 ↓
Quantity
 ↓
Quality
 ↓
Market Price
 ↓
Prediction
 ↓
Direct Buyer Listing
 ↓
Review
 ↓
Publish
```

After publishing:

```text
Listing Active
```

---

# 19. Auction Listing

If auctions are enabled:

```text
Produce
 ↓
Quantity
 ↓
Quality
 ↓
Auction Rules
 ↓
Start / End
 ↓
Minimum Bid
 ↓
Review
 ↓
Publish Auction
```

The exact auction rules should come from the approved business requirements.

Do not invent auction rules in the UI.

---

# 20. Review Listing

Before publishing:

```text
Review Your Listing

Tomato
10 Quintals

Quality
Grade A

Current Market
₹2,400/q

Expected Price
₹2,500–₹2,650/q

Selling Method
Direct Buyer
```

Primary action:

```text
[ Publish Listing ]
```

Secondary:

```text
[ Edit ]
```

---

# 21. Publish Listing

After successful submission:

```text
Your produce is listed!

Tomato
10 Quintals

Buyers can now view
your listing and send offers.

[ View Listing ]
[ Go to Sell ]
```

Do not require a separate verification screen unless the backend/business process actually requires one.

---

# 22. My Listings

Canonical destination:

```text
Sell → My Listings
```

Example:

```text
My Listings

Tomato
10 Quintals
₹2,400/q
3 Offers
Active

Onion
8 Quintals
₹1,850/q
1 Offer
Active
```

---

# 23. Listing Status

Recommended statuses:

```text
Draft
Active
Paused
Partially Sold
Sold
Closed
Expired
```

Only use statuses supported by the backend.

---

# 24. Listing Card Actions

A listing card can provide:

```text
View Details
View Offers
Edit
Pause
Close
```

Avoid showing every action simultaneously on small cards.

Prefer:

```text
View Details →
```

with secondary actions inside Listing Details.

---

# 25. Listing Details

Example:

```text
Tomato

10 Quintals
₹2,400 / Quintal

Quality
Grade A
Farmer Declared

3 Buyer Offers

Created
[date]

[ View Offers ]
```

Possible actions:

```text
Edit Listing
Pause Listing
Close Listing
```

---

# 26. Edit Listing

```text
Listing Details
 ↓
Edit Listing
 ↓
Change allowed fields
 ↓
Save Changes
 ↓
Listing Details
```

Do not allow edits that would violate an existing offer/order.

The backend must validate changes.

---

# 27. Pause Listing

If supported:

```text
Listing Details
 ↓
Pause Listing
 ↓
Confirmation
```

Confirmation:

```text
Pause this listing?

Buyers will no longer be able
to place new offers.

[ Cancel ]
[ Pause Listing ]
```

Existing offers/orders should follow the business rules defined by the backend.

---

# 28. Close Listing

If supported:

```text
Listing Details
 ↓
Close Listing
 ↓
Confirmation
```

Do not hard-delete transaction history.

Closed listings should remain available in appropriate history/audit records.

---

# 29. Buyer Opportunities

This is the farmer-facing discovery of buyers relevant to their produce.

Recommended wording:

```text
Buyers for You
```

or:

```text
Buyer Opportunities
```

Avoid making this a generic buyer directory unless explicitly required.

---

# 30. Buyer Opportunity Card

Example:

```text
Tomato

3 verified buyers interested

Highest offer
₹2,550 / Quintal

Mandi
₹2,350 / Quintal

[ View Offers ]
```

The farmer's available/listed produce should determine what opportunities are shown.

---

# 31. Buyer Offers

Canonical destination:

```text
Sell → Buyer Offers
```

Example:

```text
Buyer Offers

Tomato — 10 Quintals

ABC Foods
Verified ✓
₹2,550/q

FreshMart
Verified ✓
₹2,500/q

Local Foods
Verified ✓
₹2,450/q
```

---

# 32. Offer Details

Tap an offer:

```text
Buyer Offers
 ↓
Offer Details
```

Show:

```text
Buyer name
Verification status
Crop
Quantity
Price
Payment terms
Pickup/delivery terms
Offer expiry
```

Do not expose information the farmer is not authorized to see.

---

# 33. Compare Offers

When multiple offers are available:

```text
Buyer Offers
 ↓
Compare Offers
```

Recommended comparison:

| Field | Buyer A | Buyer B |
|---|---|---|
| Buyer | ABC Foods | FreshMart |
| Price/q | ₹2,550 | ₹2,500 |
| Quantity | 10 q | 10 q |
| Verification | Verified | Verified |
| Payment | Terms | Terms |
| Pickup | Date | Date |

The farmer should make the final choice.

---

# 34. Accept Offer

Primary action:

```text
[ Accept Offer ]
```

Before acceptance:

```text
Accept this offer?

10 Quintals
₹2,550 / Quintal

Buyer:
ABC Foods

After acceptance, an order
will be created.

[ Cancel ]
[ Accept ]
```

---

# 35. Order Creation

After successful acceptance:

```text
Offer Accepted
      ↓
Order Created
      ↓
Order Details
```

Example:

```text
Order #FP1024

Tomato
10 Quintals

₹25,500

Buyer
ABC Foods

Status
Order Confirmed
```

The Sell module should hand the transaction to Orders.

---

# 36. Orders

Orders are **not** a bottom navigation tab.

From Sell:

```text
Accepted Offer
 ↓
Order
```

From Home:

```text
My Orders
 ↓
Orders
```

From Notifications:

```text
Order Notification
 ↓
Order Details
```

All three paths should reach the same canonical Orders/Order Details implementation.

---

# 37. Logistics Handoff

After order creation:

```text
Order
 ↓
Pickup Scheduled
 ↓
Picked Up
 ↓
In Transit
 ↓
Delivered
```

Logistics is handled by the separate Logistics role/app.

The farmer should see status, timing and relevant information, not a duplicate logistics management system.

---

# 38. Payment Handoff

After delivery/according to payment terms:

```text
Order
 ↓
Payment
 ↓
Payment Completed
```

Payment status should be backend-controlled.

The farmer must not be able to alter:

```text
Payment Completed
```

from the mobile client.

---

# 39. Selling History

Canonical destination:

```text
Sell → Selling History
```

Example:

```text
Selling History

Tomato
10 Quintals
₹2,550/q
Completed

Onion
8 Quintals
₹1,900/q
Completed
```

Tap:

```text
Sale Details
```

---

# 40. Sale Details

Show:

```text
Crop
Quantity
Selling price
Buyer
Order reference
Sale date
Payment status
```

This is historical information.

Do not allow editing completed transaction values.

---

# 41. Home → Sell Connections

Home shortcuts should use the same canonical Sell screens.

```text
Home
 ↓
List Produce
 → Sell → Create Listing

Home
 ↓
View Listings
 → Sell → My Listings

Home
 ↓
New Offer
 → Sell → Offer Details

Home
 ↓
Buyer Offers
 → Sell → Buyer Offers

Home
 ↓
View History
 → Sell → Selling History
```

No duplicate versions should be created.

---

# 42. My Farm → Sell Connections

```text
My Farm
 ↓
Available Produce
 ↓
Sell This Produce
 ↓
Sell → Create Listing
```

Crop should be preselected.

Example:

```text
cropId = tomato
```

---

# 43. Insights → Sell Connections

```text
Insights
 ↓
Price Opportunity
 ↓
Buyer Interest
 ↓
View Offers
 ↓
Sell → Buyer Offers
```

or:

```text
Insights
 ↓
Crop Market Details
 ↓
Sell Tomato
 ↓
Create Listing
```

The information layer leads to the transaction layer.

---

# 44. Sell → Insights Connections

The farmer may need market information while selling.

```text
Create Listing
 ↓
Current Market Price
 ↓
Insights / Market Details
```

or:

```text
Price Prediction
 ↓
Detailed Prediction
```

The Sell form must not duplicate the full Insights analytics system.

It should show only the relevant summary.

---

# 45. Sell Page Primary Sections

Recommended:

```text
1. List Produce
2. My Listings
3. Buyer Offers / Opportunities
4. Selling History
```

This is simpler than showing every feature as a separate major card.

---

# 46. Empty States

## No produce available

```text
No produce is available to list.

Add or update your produce
in My Farm.

[ Go to My Farm ]
```

## No active listings

```text
No active listings yet.

List your produce to start
receiving buyer offers.

[ List Produce ]
```

## No offers

```text
No buyer offers yet.

Your active listings will appear
here when buyers respond.
```

## No sales history

```text
No completed sales yet.

Your completed sales will appear here.
```

---

# 47. Error States

Example:

```text
We couldn't load your listings.

Please check your connection
and try again.

[ Try Again ]
```

For listing submission:

```text
We couldn't create your listing.

Your information has not been submitted.

[ Try Again ]
```

Do not show a false success state after a failed request.

---

# 48. Loading States

Use skeleton loading for:

```text
Available produce
Active listings
Buyer offers
Selling history
Market summary
```

Do not use fake values while loading.

---

# 49. Stale Market Data

If market information inside Sell is cached:

```text
Market price
Updated 30 min ago
```

If stale:

```text
Last updated 2 hours ago
```

Do not imply that cached data is live.

---

# 50. Form Validation

Minimum validation:

```text
Produce selected
Quantity > 0
Quantity <= available quantity
Required quality fields completed
Required photos present if mandated
Selling method selected
Required price/listing fields valid
```

Validation should be clear and farmer-friendly.

Bad:

```text
INVALID_QUANTITY
```

Good:

```text
Please enter a quantity
up to 12 Quintals.
```

---

# 51. Draft Handling

If the product supports drafts:

```text
Create Listing
 ↓
Enter information
 ↓
Leave
 ↓
Save Draft?
```

If saved:

```text
Sell
 ↓
Drafts
 ↓
Continue Listing
```

If drafts are not part of the MVP, do not add the feature.

---

# 52. Unsaved Data Protection

If meaningful listing information has been entered:

```text
Leave listing?

Your entered information will be lost.

[ Stay ]
[ Leave ]
```

If nothing has been entered:

```text
Back
 ↓
Previous screen
```

---

# 53. Animation

Keep motion consistent with the other Farmer screens.

### Screen entry

```text
250–300ms
Fade + translateY 8–12dp
```

### Step transition

```text
250–300ms
Horizontal slide or fade
```

Choose one consistent transition style across the listing flow.

### Button press

```text
100–150ms
Scale ≈ 0.97
```

### Success

```text
250–400ms
Checkmark / success transition
```

Avoid:

```text
Bouncing cards
Long page transitions
Animated farm backgrounds
Moving leaves
Heavy parallax
Continuous decorative animation
```

---

# 54. Accessibility

Minimum interactive target:

**48 × 48 dp-equivalent**

Requirements:

- Clear labels
- Accessible buttons
- Large readable prices
- Status not communicated by color alone
- Screen-reader labels for icons
- Form errors announced clearly
- Crop and quantity values readable with large text
- Images have useful descriptions when they communicate information
- Decorative images marked as decorative
- Localization-ready strings

---

# 55. Responsive Design

Reference:

```text
1080 × 2340 px
```

This is a visual design reference.

Do not hard-code:

```text
width = 1080
height = 2340
```

in React Native.

Use:

```text
Flexbox
useWindowDimensions()
Safe-area insets
ScrollView
Responsive card widths
```

Starting tokens:

```text
Horizontal padding: 20–24dp
Card radius: 16–20dp
Card padding: 16–20dp
Section gap: 16–24dp
Touch target: ≥48dp
```

---

# 56. Data Ownership

Sell primarily reads/writes:

```text
Produce
Listing
Listing Quality
Buyer Interest
Offer
Sale
```

It reads supporting data from:

```text
Farm / Crop
Market Price
Price Prediction
```

It hands completed transactions to:

```text
Order
Logistics
Payment
```

---

# 57. Suggested Data Models

```ts
type ProduceListing = {
  id: string;
  farmerId: string;
  cropId: string;
  quantity: number;
  unit: string;
  quality?: {
    grade?: string;
    condition?: string;
    status?: "farmer_declared" | "farmprism_verified" | "buyer_accepted";
  };
  askingPrice?: number;
  sellingMethod: "direct_buyer" | "auction";
  status: "draft" | "active" | "paused" | "partially_sold" | "sold" | "closed" | "expired";
  createdAt: string;
};

type BuyerOffer = {
  id: string;
  listingId: string;
  buyerId: string;
  price: number;
  quantity: number;
  unit: string;
  paymentTerms?: string;
  pickupTerms?: string;
  expiresAt?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
};

type Sale = {
  id: string;
  orderId: string;
  listingId: string;
  farmerId: string;
  buyerId: string;
  cropId: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  completedAt?: string;
};
```

Adapt these to the existing FarmPrism backend/schema.

---

# 58. System Design

```text
                    FARMER
                       │
                       ▼
              React Native / Expo
                       │
                       ▼
                    SELL UI
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Listing       Offers       History
       Service       Service       Service
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
                  Backend API
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
     Produce         Buyer         Market /
     / Farm          Data          Prediction
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                    Listing
                       │
                       ▼
                     Offer
                       │
                       ▼
                  Accept Offer
                       │
                       ▼
                     Order
                  ┌────┴────┐
                  ▼         ▼
              Logistics   Payment
```

---

# 59. Backend Responsibilities

Backend should control:

- Listing ownership
- Available quantity
- Quality status
- Buyer eligibility
- Offer validity
- Highest offer
- Offer expiry
- Offer acceptance
- Order creation
- Sale totals
- Payment state
- Market data
- Price prediction

The mobile client should not be the source of truth.

---

# 60. Critical Transaction Rule

When accepting an offer, use a backend transaction.

Conceptually:

```text
Check listing still active
        ↓
Check quantity available
        ↓
Check offer still valid
        ↓
Accept offer
        ↓
Reserve/reduce quantity
        ↓
Create order
        ↓
Update listing
        ↓
Return success
```

This prevents two buyers/offers from being accepted against the same produce quantity.

---

# 61. Authorization

Backend must verify:

```text
Farmer owns listing
Farmer owns produce
Buyer is authorized
Offer belongs to listing
Farmer is authorized to accept offer
Order belongs to accepted transaction
```

The client must never be trusted to decide:

```text
buyer verified
offer valid
listing owned
payment complete
order delivered
```

---

# 62. Notifications Triggered by Sell

Sell actions can generate notifications.

Examples:

```text
Listing Published
New Buyer Offer
Offer Expiring Soon
Offer Accepted
Order Created
Pickup Scheduled
Payment Received
```

The notification system should deep-link to the relevant record.

---

# 63. Analytics Events

Optional product analytics:

```text
sell_opened
list_produce_started
produce_selected
quantity_entered
quality_added
price_prediction_viewed
listing_reviewed
listing_published
listing_viewed
buyer_offers_opened
offer_viewed
offers_compared
offer_accepted
sale_completed
```

These are internal analytics, not visible to the farmer.

---

# 64. Suggested React Native Structure

```text
src/
├── screens/
│   └── farmer/
│       ├── SellScreen.tsx
│       ├── CreateListingScreen.tsx
│       ├── ListingDetailsScreen.tsx
│       ├── MyListingsScreen.tsx
│       ├── BuyerOffersScreen.tsx
│       ├── OfferDetailsScreen.tsx
│       ├── CompareOffersScreen.tsx
│       ├── SellingHistoryScreen.tsx
│       └── SaleDetailsScreen.tsx
│
├── components/
│   └── sell/
│       ├── SellHeader.tsx
│       ├── ProduceCard.tsx
│       ├── ListingCard.tsx
│       ├── OfferCard.tsx
│       ├── QualitySection.tsx
│       ├── MarketPriceSummary.tsx
│       ├── PredictionSummary.tsx
│       └── SellBanner.tsx
│
├── services/
│   ├── listingService.ts
│   ├── offerService.ts
│   ├── saleService.ts
│   └── sellService.ts
│
└── models/
    ├── listing.ts
    ├── offer.ts
    └── sale.ts
```

Adapt to the project's existing structure rather than duplicating services.

---

# 65. Performance

- Use one consolidated Sell summary request where practical.
- Paginate long listing/history lists.
- Lazy-load offer details.
- Cache stable listing information.
- Do not load complete historical analytics into the Sell home.
- Compress crop imagery.
- Avoid unnecessary requests when navigating between related screens.

---

# 66. Final Canonical Navigation Table

| Sell element | Action | Destination |
|---|---|---|
| List Produce | Tap | Create Listing |
| Available Produce | Tap | Select/Create Listing |
| My Listings | Tap | My Listings |
| Listing card | Tap | Listing Details |
| View Offers | Tap | Buyer Offers |
| Edit Listing | Tap | Edit Listing |
| Pause Listing | Tap | Pause Confirmation |
| Close Listing | Tap | Close Confirmation |
| Buyer Opportunities | Tap | Buyer Offers |
| Offer card | Tap | Offer Details |
| Compare Offers | Tap | Compare Offers |
| Accept Offer | Tap | Confirmation → Order |
| Selling History | Tap | Selling History |
| Sale card | Tap | Sale Details |
| Market Price | Tap | Insights → Market Details |
| Price Prediction | Tap | Insights → Prediction Details |
| Notification | Tap | Relevant deep link |
| Bottom Home | Tap | Home |
| Bottom My Farm | Tap | My Farm |
| Bottom Sell | Tap | Sell |
| Bottom Insights | Tap | Insights |
| Bottom Profile | Tap | Profile |

---

# 67. Final Farmer Journey

The ideal commercial journey is:

```text
MY FARM
   │
   │ What do I have?
   ▼
AVAILABLE PRODUCE
   │
   │ What can I sell?
   ▼
SELL
   │
   ├── Quantity
   ├── Quality
   ├── Market Price
   └── Prediction
          │
          ▼
    BUYER OFFERS
          │
          ▼
    COMPARE OFFERS
          │
          ▼
      ACCEPT
          │
          ▼
        ORDER
          │
          ▼
      LOGISTICS
          │
          ▼
       PAYMENT
```

---

# 68. Final UX Principle

The Sell page should not feel like a complicated marketplace.

It should feel like:

> **"I have produce. FarmPrism helps me understand its value, find serious buyers, compare their offers and sell directly."**

The farmer remains in control.

FarmPrism should:

```text
INFORM
   ↓
SHOW OPPORTUNITIES
   ↓
MAKE COMPARISON EASY
   ↓
ENABLE DIRECT SELLING
```

It should not:

```text
FORCE A PRICE
FORCE A SALE
GUARANTEE A PREDICTION
MAKE FARMING DECISIONS FOR THE FARMER
```

This document is the source of truth for Sell-page interactions and navigation in the React Native / Expo Farmer application.
