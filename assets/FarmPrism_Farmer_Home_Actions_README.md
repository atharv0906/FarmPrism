# FarmPrism — Farmer Home Page
## Detailed UX Action & Navigation Handoff v3.0

**Platform:** React Native / Expo  
**Target:** Android-first mobile application  
**Visual reference:** 1080 × 2340 px (9:19.5)

---

# 1. Purpose of the Home Page

The Farmer Home page is the farmer's **daily starting point**.

It is not the owner of every feature in the application.

Instead, Home provides:

- a quick overview of the farmer's current situation
- the most important selling opportunity
- current market information
- active selling activity
- shortcuts to important destinations

The Home page should answer:

> **What matters to me today?**

The detailed functionality belongs to the appropriate module:

```text
MY FARM  → What I have
INSIGHTS → What it is worth / what the market is doing
SELL     → What I can sell and who wants it
ORDERS   → What I have already sold / delivery status
PROFILE  → My account and settings
```

---

# 2. Bottom Navigation

The Farmer app uses exactly five primary tabs:

```text
┌────────┬──────────┬────────┬──────────┬─────────┐
│  Home  │ My Farm  │  Sell  │ Insights │ Profile │
└────────┴──────────┴────────┴──────────┴─────────┘
```

Home is selected when this screen is open.

### Important

Do **not** add:

```text
Market
Orders
Buyers
Payments
```

as additional bottom-navigation tabs.

Those are secondary destinations reached from the appropriate feature.

---

# 3. Global Navigation Principle

Every action on Home must have **one canonical destination**.

Home may contain shortcuts to the same destination, but it must not create duplicate versions of that feature.

Example:

```text
Check Prices
     ↓
Insights → Market Prices
```

and:

```text
Today's Market Prices → View Market
     ↓
Insights → Market Prices
```

Both actions intentionally lead to the same canonical screen.

This prevents duplicate pages and inconsistent data.

---

# 4. Complete Home Action Map

```text
HOME
│
├── Notification Bell
│      └── Notifications
│
├── Your Farm at a Glance
│      ├── View Details → My Farm
│      └── Manage My Farm → My Farm
│
├── Top Opportunity for You
│      ├── View Offers → Buyer Offers
│      └── View All → Buyer Opportunities / Offers
│
├── Today's Market Prices
│      ├── View Market → Insights → Market Prices
│      └── Crop tile → Insights → Crop Market Details
│
├── Your Selling Activity
│      ├── View Listings → Sell → My Listings
│      ├── Review Now → Offer Details
│      └── View History → Sell → Selling History
│
├── Quick Actions
│      ├── List Produce → Sell → Create Listing
│      ├── Check Prices → Insights → Market Prices
│      ├── Buyer Offers → Sell → Buyer Offers
│      └── My Orders → Orders
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

# 5. Header Actions

## 5.1 FarmPrism Logo

The logo is primarily branding.

Recommended behavior:

```text
Tap logo → No navigation
```

It should not unexpectedly take the farmer somewhere.

The logo is not a Home shortcut.

---

# 6. Notification Bell

Location:

**Top-right**

Visual:

```text
🔔
●
```

The red dot indicates unread notifications.

## On tap

```text
Home
 ↓
Notifications
```

## Notifications screen

Possible notification types:

```text
New buyer offer
New bid
Listing status update
Auction ending
Pickup scheduled
Produce picked up
Order delivered
Payment received
Market price update
Important FarmPrism update
```

## Notification deep links

A notification should open the relevant destination.

Examples:

```text
New Buyer Offer
    ↓
Offer Details
```

```text
Pickup Scheduled
    ↓
Order Details
```

```text
Market Price Changed
    ↓
Insights → Market Details
```

## Read/unread behavior

On opening a notification:

```text
Unread → Read
```

The notification badge should update accordingly.

If there are no unread notifications:

```text
Bell
```

without the red badge.

---

# 7. Your Farm at a Glance

This section gives the farmer a compact summary.

Example:

```text
Your Farm at a Glance

2 Crops
5.0 Acres
12 Quintals Available to Sell

Manage My Farm →
```

The numbers are dynamic.

---

## 7.1 View Details

### Action

```text
View Details →
```

### Destination

```text
My Farm
```

Do not create a separate duplicate "Farm Details" dashboard.

The canonical destination is:

```text
My Farm
```

---

## 7.2 Manage My Farm

### Action

```text
Manage My Farm
```

### Destination

```text
My Farm
```

Both:

```text
View Details
Manage My Farm
```

lead to the same primary module.

---

## 7.3 Crops metric

The crop count itself can be interactive.

Recommended:

```text
Tap 2 Crops
    ↓
My Farm → My Crops
```

If the metric is intended only as information, it may remain non-clickable. Do not make every number clickable unnecessarily.

---

## 7.4 Acres metric

Recommended:

```text
Tap 5.0 Acres
    ↓
My Farm → Farm Overview
```

This is optional.

For a simpler farmer experience, the metric can remain informational.

---

## 7.5 Available-to-sell quantity

Recommended:

```text
Tap 12 Quintals
    ↓
My Farm → Available Produce
```

This is useful because it connects directly to the farmer's inventory.

---

# 8. Top Opportunity for You

This is the **highest-priority Home action**.

Example:

```text
Top Opportunity for You

Tomato
3 verified buyers are interested

Highest offer
₹2,550 / Quintal

Mandi price
₹2,350 / Quintal

You can get
₹200 more / Quintal

[ View Offers ]
```

The content must be generated from real farmer-specific data.

---

## 8.1 View Offers

### Action

```text
View Offers →
```

### Destination

```text
Buyer Offers
```

Preferably filtered to the crop shown in the card.

Example:

```text
Home
 ↓
View Offers
 ↓
Tomato Buyer Offers
```

The farmer immediately sees:

```text
Buyer A
Verified ✓
₹2,550 / q

Buyer B
Verified ✓
₹2,500 / q

Buyer C
Verified ✓
₹2,450 / q
```

---

## 8.2 Offer Details

Tapping an individual offer:

```text
Buyer Offers
 ↓
Offer Details
```

Example information:

```text
Buyer
Verification status
Offered price
Quantity
Payment terms
Pickup/delivery information
Offer expiry
```

---

## 8.3 Compare Offers

If multiple offers exist:

```text
Offer Details
 ↓
Compare Offers
```

The comparison should include more than price where relevant.

Possible fields:

```text
Buyer
Price / Quintal
Quantity
Payment terms
Pickup date
Delivery conditions
Verification
```

---

## 8.4 Accept Offer

```text
Compare Offers
 ↓
Accept Offer
 ↓
Confirmation
 ↓
Order Created
```

After acceptance:

```text
Offer Accepted
      ↓
Order Created
      ↓
Logistics
      ↓
Payment
```

Home itself should not perform offer acceptance.

It only starts the journey.

---

## 8.5 View All

Current label:

```text
View All →
```

Destination:

```text
Buyer Opportunities / Buyer Offers
```

This shows relevant opportunities across the farmer's produce.

It should not become a generic public buyer directory unless the product requirements later explicitly call for that.

---

# 9. Today's Market Prices

Example:

```text
Today's Market Prices

Onion    ₹1,800/q   ↑2.5%
Potato   ₹2,200/q   ↑1.8%
Tomato   ₹2,400/q   ↑3.1%

View Market →
```

---

## 9.1 View Market

### Destination

```text
Insights → Market Prices
```

There is no separate Market bottom tab.

---

## 9.2 Crop Price Tile

Example:

```text
Tomato
₹2,400 / Quintal
↑ 3.1%
```

On tap:

```text
Insights
 ↓
Tomato Market Details
```

Show:

```text
Current market price
Price trend
Mandi reference
Price prediction
Buyer demand
Farmer's previous selling price
```

Possible action:

```text
Sell Tomato →
```

which starts:

```text
Sell → Create Listing
```

with Tomato already selected.

---

# 10. Your Selling Activity

This section is about **active selling and completed selling**, not general analytics.

It contains:

```text
Active Listings
New Offer
Sold This Month
```

---

# 11. Active Listings

Example:

```text
2
Active Listings

View Listings →
```

### Destination

```text
Sell → My Listings
```

Example:

```text
My Listings

Tomato
10 Quintals
Active
3 Offers

Onion
8 Quintals
Active
1 Offer
```

Tap a listing:

```text
Listing Details
```

---

# 12. New Offer

Example:

```text
1
New Offer

Review Now →
```

### Destination

**Directly to the new offer**, not generic Sell.

```text
Home
 ↓
Review Now
 ↓
Offer Details
```

This is important because the farmer has a specific pending action.

---

# 13. Sold This Month

Example:

```text
₹18,500
Sold This Month

View History →
```

### Destination

```text
Sell → Selling History
```

The history screen can show:

```text
Completed sale
Crop
Quantity
Selling price
Buyer
Sale date
Order reference
```

Do not create a separate "Home History" system.

---

# 14. Quick Actions

Quick Actions are shortcuts.

They should not duplicate the actual feature architecture.

Recommended:

```text
List Produce
Market Prices
Buyer Offers
My Orders
```

---

# 15. List Produce

### Action

```text
List Produce
```

### Destination

```text
Sell → Create Listing
```

The farmer should land directly on the first step:

```text
Select Produce
```

Recommended flow:

```text
Select Produce
 ↓
Quantity
 ↓
Quality
 ↓
Photos
 ↓
Market Price
 ↓
Price Prediction
 ↓
Selling Method
 ↓
Review
 ↓
List Produce
 ↓
Success
```

---

# 16. Market Prices

Recommended label:

```text
Market Prices
```

instead of:

```text
Check Prices
```

This is clearer for farmers.

### Destination

```text
Insights → Market Prices
```

This must be the same destination used by:

```text
Today's Market Prices → View Market
```

---

# 17. Buyer Offers

Recommended replacement for:

```text
Find Buyers
```

### Why

"Find Buyers" could imply a generic directory.

The actual useful function is:

> Buyers interested in the farmer's produce.

Therefore:

```text
Buyer Offers
```

or:

```text
Buyers for You
```

is clearer.

### Destination

```text
Sell → Buyer Offers
```

The screen should prioritize buyers related to the farmer's active/available produce.

---

# 18. My Orders

### Destination

```text
Orders
```

Orders are a secondary transaction destination.

They are intentionally **not** part of bottom navigation.

---

## 18.1 Order Details

```text
Orders
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

Pickup
18 Aug

Status
Pickup Scheduled
```

---

## 18.2 Order status

```text
Order Confirmed
 ↓
Pickup Scheduled
 ↓
Picked Up
 ↓
In Transit
 ↓
Delivered
 ↓
Payment Completed
```

Logistics is a separate role/app.

The farmer only needs the relevant status and details.

---

# 19. Bottom Navigation Actions

## Home

```text
Tap Home
 ↓
Home
```

If already on Home:

```text
Tap Home
 ↓
Scroll to top
```

Optional but recommended.

---

## My Farm

```text
Tap My Farm
 ↓
My Farm
```

Canonical purpose:

> What I have.

---

## Sell

```text
Tap Sell
 ↓
Sell
```

Canonical purpose:

> What I can sell.

---

## Insights

```text
Tap Insights
 ↓
Insights
```

Canonical purpose:

> What it is worth / what is happening in the market.

---

## Profile

```text
Tap Profile
 ↓
Profile
```

Canonical purpose:

> My account and settings.

---

# 20. Brand Banner

The bottom banner:

```text
Together for a
Stronger Tomorrow

Farmers grow. We connect.
```

should normally be:

```text
NON-CLICKABLE
```

It is decorative brand reinforcement.

Do not send farmers into an unnecessary page when they tap a decorative banner.

If the product later requires an About FarmPrism page, this can become clickable, but that is not required for the current MVP.

---

# 21. What Home Does NOT Do

Home should NOT directly contain full implementations of:

```text
Crop management
Quality verification
Buyer management
Market analytics
Price prediction calculations
Order management
Logistics management
Payment processing
Profile editing
```

It only provides summaries and shortcuts.

---

# 22. Canonical Destination Table

| Home element | Action | Destination |
|---|---|---|
| Logo | Tap | No navigation |
| Notification bell | Tap | Notifications |
| View Details | Tap | My Farm |
| Manage My Farm | Tap | My Farm |
| Crops metric | Tap, optional | My Farm → My Crops |
| Acres metric | Tap, optional | My Farm → Farm Overview |
| Available quantity | Tap | My Farm → Available Produce |
| Top Opportunity | Tap card | Buyer Offers |
| View Offers | Tap | Buyer Offers filtered by crop |
| View All | Tap | Buyer Opportunities / Offers |
| Market price tile | Tap | Insights → Crop Market Details |
| View Market | Tap | Insights → Market Prices |
| View Listings | Tap | Sell → My Listings |
| Review Now | Tap | Offer Details |
| View History | Tap | Sell → Selling History |
| List Produce | Tap | Sell → Create Listing |
| Market Prices | Tap | Insights → Market Prices |
| Buyer Offers | Tap | Sell → Buyer Offers |
| My Orders | Tap | Orders |
| Bottom Home | Tap | Home |
| Bottom My Farm | Tap | My Farm |
| Bottom Sell | Tap | Sell |
| Bottom Insights | Tap | Insights |
| Bottom Profile | Tap | Profile |
| Brand banner | Tap | No navigation |

---

# 23. Deep-Link Rules

Home shortcuts should preserve context.

Example:

```text
Home
 ↓
Tomato opportunity
 ↓
Buyer Offers
```

The Buyer Offers screen should open already filtered to:

```text
Tomato
```

Similarly:

```text
Home
 ↓
Tomato market price
 ↓
Insights
```

should open:

```text
Tomato Market Details
```

And:

```text
Home
 ↓
List Produce
```

opens:

```text
Create Listing
```

with no crop preselected unless the farmer came from a crop-specific action.

---

# 24. Back Navigation

Recommended behavior:

### Home → My Farm

Back:

```text
My Farm → Home
```

### Home → Buyer Offers

Back:

```text
Buyer Offers → Home
```

### Home → Market Details

Back:

```text
Market Details → Insights
```

This follows the actual navigation stack.

Do not force every Back action to Home.

---

# 25. Unsaved Data Protection

If the farmer starts an action from Home and enters a form:

```text
Home
 ↓
Create Listing
 ↓
Quantity
```

and presses Back:

Show a confirmation only if meaningful data has been entered:

```text
Leave this listing?

Your entered information will be lost.

[ Stay ]
[ Leave ]
```

Do not show this confirmation when the form is untouched.

---

# 26. Loading Behavior

Home should load progressively.

Recommended:

```text
Header
 ↓
Farm summary skeleton
 ↓
Opportunity skeleton
 ↓
Market skeleton
 ↓
Selling activity skeleton
```

Do not show fake values such as:

```text
₹0
0 buyers
0 listings
```

unless those are genuine values.

---

# 27. Empty States

## No opportunity

```text
No special opportunities right now.

We'll show you when buyers
are interested in your produce.
```

## No listings

```text
No active listings.

[ List Produce ]
```

## No offers

```text
No new offers yet.

Your active listings will appear here.
```

## No sales

```text
No completed sales yet.

Your selling history will appear
after your first completed sale.
```

## No crops

```text
Add your crops in My Farm
to see personalized opportunities.

[ Go to My Farm ]
```

---

# 28. Error Handling

If one Home section fails, do not necessarily block the entire page.

Example:

```text
Market prices couldn't be loaded.

[ Try Again ]
```

Other sections should remain usable when possible.

For a complete API failure:

```text
We couldn't load your Home page.

Please check your connection.

[ Try Again ]
```

---

# 29. Stale Data

If cached market data is shown:

```text
Market prices
Updated 45 min ago
```

If sufficiently stale:

```text
Last updated 3 hours ago
```

Do not present stale values as real-time.

---

# 30. Dynamic Data

The following must be rendered dynamically:

```text
Farmer name
Location
Crop count
Farm area
Available quantity
Top opportunity
Buyer count
Highest offer
Mandi/reference price
Market prices
Percentage changes
Active listing count
New offer count
Monthly sales
```

Do not bake these into image assets.

---

# 31. Recommended Home API Response

A consolidated response can reduce multiple requests:

```ts
type FarmerHomeSummary = {
  farmer: {
    id: string;
    name: string;
    location?: string;
  };

  farm: {
    cropCount: number;
    totalAcres: number;
    availableQuantity: number;
    quantityUnit: string;
  };

  topOpportunity?: {
    cropId: string;
    cropName: string;
    buyerCount: number;
    highestOffer?: number;
    marketReferencePrice?: number;
    unit: string;
  };

  marketPrices: Array<{
    cropId: string;
    cropName: string;
    price: number;
    unit: string;
    changePercent?: number;
    observedAt: string;
  }>;

  sellingActivity: {
    activeListings: number;
    newOffers: number;
    soldThisMonth: number;
    soldThisMonthCurrency: string;
  };

  notifications: {
    unreadCount: number;
  };
};
```

Adapt this to the existing FarmPrism backend.

---

# 32. Home → Sell Transaction Flow

The most important Home journey is:

```text
Top Opportunity
      ↓
Buyer Offers
      ↓
Compare Offers
      ↓
Accept Offer
      ↓
Order Created
      ↓
Logistics
      ↓
Payment
```

A second important journey:

```text
List Produce
      ↓
Create Listing
      ↓
Quality
      ↓
Market Price
      ↓
Price Prediction
      ↓
Review
      ↓
Listing Active
      ↓
Buyer Offers
```

---

# 33. Home → Insights Flow

```text
Today's Market Prices
      ↓
Insights
      ↓
Market Prices
      ↓
Crop Details
      ↓
Price Prediction
      ↓
Buyer Interest
      ↓
Sell / Offers
```

This is the information-to-action loop.

---

# 34. Home → My Farm Flow

```text
Your Farm at a Glance
      ↓
My Farm
      ↓
My Crops
      ↓
Crop Details
      ↓
Available Produce
      ↓
Sell
```

---

# 35. Home → Orders Flow

```text
My Orders
      ↓
Orders
      ↓
Order Details
      ↓
Delivery Status
      ↓
Payment Status
```

---

# 36. UX Rules for Farmers

The Home screen should be:

- simple
- readable
- touch-friendly
- low cognitive load
- action-oriented
- farmer-specific

Avoid:

- too many buttons
- duplicate pages
- complex analytics
- unnecessary technical terminology
- aggressive selling recommendations
- excessive animation
- tiny touch targets

The farmer should not have to understand the application architecture.

---

# 37. Animation

Home animation should be subtle.

### Screen entry

```text
250–300ms
Fade + slight upward movement
```

### Cards

Optional:

```text
40–60ms stagger
```

### Button press

```text
100–150ms
scale ≈ 0.97
```

### Notification badge

A small update animation is acceptable.

### Avoid

```text
Continuous background animation
Bouncing cards
Parallax-heavy hero
Animated leaves
Long loading animations
```

The app must remain usable without animation.

---

# 38. Accessibility

Minimum interactive target:

**48 × 48 dp-equivalent**

Requirements:

- Icon-only notification button needs accessible label.
- Buttons must have readable labels.
- Price changes should use icon + text, not color alone.
- Support large font sizes.
- Dynamic text must not clip.
- Decorative artwork should be marked decorative.
- All user-facing strings should be localization-ready.

---

# 39. Security

Home values must not be treated as trusted merely because they are displayed by the client.

Backend must authorize:

- Farmer identity
- Farm ownership
- Produce quantities
- Listings
- Buyer offers
- Orders
- Selling history

The client must not be allowed to modify:

```text
Highest offer
Buyer verification
Market price
Sold amount
Order status
Payment status
```

These are backend-controlled values.

---

# 40. Final Home Architecture

```text
                         FARMER HOME
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
       ▼                      ▼                      ▼
    MY FARM               INSIGHTS                 SELL
       │                      │                      │
 What I have             What it is worth       What I can sell
       │                      │                      │
       └──────────────┐       │       ┌──────────────┘
                      ▼       ▼       ▼
                       BUYER OFFERS
                             │
                             ▼
                       COMPARE OFFERS
                             │
                             ▼
                        ACCEPT OFFER
                             │
                             ▼
                           ORDER
                             │
                       ┌─────┴─────┐
                       ▼           ▼
                   LOGISTICS     PAYMENT
```

---

# 41. Final Principle

**Home is a dashboard and shortcut layer, not a second copy of every module.**

The farmer should see:

```text
WHAT MATTERS TODAY
        ↓
WHERE SHOULD I GO?
        ↓
ONE CLEAR DESTINATION
```

The canonical mental model is:

```text
MY FARM
What I have
     ↓
INSIGHTS
What it is worth
     ↓
SELL
How I can sell it
     ↓
ORDERS
What I sold
     ↓
LOGISTICS + PAYMENT
What happens next
```

This navigation structure should be treated as the source of truth for implementing all Home-page actions in React Native / Expo.
