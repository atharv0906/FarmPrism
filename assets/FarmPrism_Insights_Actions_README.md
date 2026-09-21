# FarmPrism — Farmer Insights
## Detailed UX Action & Navigation Handoff

**Platform:** React Native / Expo  
**Target:** Android-first  
**Visual reference:** 1080 × 2340 px (9:19.5)

---

## 1. Purpose

Insights is the farmer's **market intelligence and decision-support center**.

Core question:

> What is my produce worth, how is the market moving, and what selling opportunity should I consider?

Insights owns:

- Price insights
- Market prices
- Price trends
- Price prediction
- Crop-wise selling insights
- Selling-price vs market comparison
- Buyer interest summary
- FarmPrism recommendations
- Lightweight earnings/selling insights

Insights does NOT own:

- Farm/crop records → My Farm
- Listings/offers/offer acceptance → Sell
- Delivery → Logistics
- Completed-order/payment execution → Orders

---

## 2. Bottom Navigation

```text
Home | My Farm | Sell | Insights | Profile
                          ↑
                       Selected
```

There is no separate Market tab.

Market information is part of Insights.

---

## 3. Complete Action Map

```text
INSIGHTS
│
├── Today's Price Opportunity
│      └── View Details → Crop Market Details
│
├── Price Trend
│      └── View Market → Market Prices / Crop Market Details
│
├── Your Price vs Market
│      └── View Details → Selling History / Price Comparison
│
├── Crop-wise Insights
│      ├── View All → Crop Insights
│      └── Crop → Crop Market Details
│
├── Buyer Interest
│      └── View Offers → Sell → Buyer Offers
│
├── FarmPrism Insight
│      └── View Details → Recommendation Details
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

Recommended:

```text
FarmPrism logo
Notification bell

Market Insights

Better information.
Better decisions.
Brighter futures.

Location
Data freshness
```

### Logo

Tap:

```text
No navigation
```

### Notification

Tap:

```text
Notifications
```

Notifications can deep-link to offers, orders, payments or market details.

---

# 5. Today's Price Opportunity

This is the primary Insights action.

Example:

```text
Today's Price Opportunity

Tomato
High Demand

Current Market Price
₹2,400 / Quintal

↑ 3.1%

FarmPrism Prediction
₹2,500 – ₹2,650 / Quintal

Prices may improve
in the next 7 days.

[ View Details ]
```

### View Details

Destination:

```text
Crop Market Details
```

Recommended detail content:

```text
Current Price
Market Trend
Prediction
Mandi Reference
Buyer Demand
Farmer's Previous Selling Price
```

Possible next action:

```text
Sell Tomato
 ↓
Sell → Create Listing
```

---

# 6. Price Prediction

Prediction is decision support, not a guarantee.

Correct:

```text
Possible range:
₹2,500–₹2,650 / Quintal
```

Incorrect:

```text
You will get ₹2,650.
```

The prediction should contain:

```text
Lower range
Upper range
Unit
Prediction horizon
Generated timestamp
Confidence, if available
```

### Tap

```text
Prediction
 ↓
Prediction Details
```

---

# 7. Price Trend

Example:

```text
Price Trend — Tomato

Last 7 Days

₹3,000
₹2,500
₹2,000
₹1,500

6 Aug → 12 Aug

Tomato prices increased
8% this week.
```

### View Market

Destination:

```text
Market Prices / Crop Market Details
```

Do not create a separate duplicate market module.

### Chart interaction

If supported:

```text
Tap data point
 ↓
Date + price tooltip
```

Keep interactions simple.

---

# 8. Your Price vs Market

This section demonstrates FarmPrism's direct-selling value.

Example:

```text
Your Average Selling Price
₹2,550 / Quintal

Mandi Reference Price
₹2,350 / Quintal

You received
₹200 more / Quintal
```

### View Details

Destination:

```text
Selling History / Price Comparison
```

Use the canonical selling-history data owned by Sell.

Do not create a separate duplicate transaction history.

---

# 9. Price Comparison Calculation

The difference must be calculated:

```text
difference =
farmerAverageSellingPrice - marketReferencePrice
```

Do not hard-code:

```text
₹200 more
```

If either value is unavailable:

```text
Price comparison unavailable
```

Do not show fake ₹0 values.

---

# 10. Crop-wise Insights

Example:

```text
Crop-wise Insights

Tomato
₹2,400/q
↑ 3.1%

Onion
₹1,800/q
↑ 2.5%

Potato
₹2,200/q
↑ 1.8%
```

Only show crops actually associated with the farmer.

The prototype may use Tomato, Onion and Potato, but production data must be dynamic.

### View All

Destination:

```text
Crop Insights
```

### Crop card

Tap:

```text
Crop Market Details
```

---

# 11. Buyer Interest

Example:

```text
Buyer Interest

3 verified buyers
are interested in your Tomato.

Highest Offer
₹2,550 / Quintal

₹150 above mandi price

[ View Offers ]
```

### View Offers

Destination:

```text
Sell → Buyer Offers
```

The destination must be the same Buyer Offers implementation used by:

```text
Home → Top Opportunity → View Offers
Sell → Buyer Offers
```

Only the initial crop filter/context changes.

---

# 12. Buyer Interest With No Offers

Display:

```text
No buyer interest yet.

Check your active listings
or list produce for sale.
```

Optional CTA:

```text
[ View Listings ]
```

→

```text
Sell → My Listings
```

or:

```text
[ List Produce ]
```

→

```text
Sell → Create Listing
```

---

# 13. FarmPrism Insight

Example:

```text
FarmPrism Insight

Good time to sell your Tomato.

Based on current demand
and market trends, you may get
5–10% better prices if you sell
in the next 7 days.
```

### Important

This is a recommendation, not an instruction.

Avoid:

```text
SELL NOW
WAIT EXACTLY 7 DAYS
YOU WILL GET ₹2,650
```

Prefer:

```text
Prices may improve.
```

or:

```text
You may consider comparing
offers over the next few days.
```

---

# 14. Recommendation Details

If the farmer taps the recommendation:

```text
FarmPrism Insight
 ↓
Recommendation Details
```

Show:

```text
Recommendation
Why it was generated
Market signals used
Price trend
Buyer demand
Prediction range
Generated time
Confidence, if available
```

The farmer remains responsible for the final decision.

---

# 15. Insights → Sell

Primary commercial path:

```text
Insights
 ↓
Price Opportunity
 ↓
Buyer Interest
 ↓
View Offers
 ↓
Compare Offers
 ↓
Accept Offer
 ↓
Order
```

Alternative:

```text
Insights
 ↓
Crop Market Details
 ↓
Sell This Crop
 ↓
Sell → Create Listing
```

The crop should be preselected where context allows.

---

# 16. Insights → My Farm

```text
Insights
 ↓
Crop
 ↓
Crop Market Details
 ↓
My Farm / Crop Details
```

This moves from:

```text
What it is worth
```

to:

```text
What I have
```

Use existing My Farm crop records.

Do not duplicate crop-management functionality inside Insights.

---

# 17. Insights → Selling History

From:

```text
Your Price vs Market
```

the farmer can open:

```text
Selling History
```

Canonical destination:

```text
Sell → Selling History
```

Use a crop filter if the farmer arrived from a crop-specific insight.

---

# 18. Market Prices

The Market Prices area belongs to Insights.

Possible navigation:

```text
Home → View Market
      ↓
Insights → Market Prices
```

and:

```text
Home → Check Prices
      ↓
Insights → Market Prices
```

Both must resolve to the same screen/component.

---

# 19. Crop Market Details

Recommended hierarchy:

```text
Crop Name
Current Market Price
Price Change
Price Trend
FarmPrism Prediction
Mandi Reference
Buyer Demand
Farmer's Selling History
```

Primary actions:

```text
[ View Offers ]
[ Sell This Produce ]
```

---

# 20. Earnings Insights

If included on the main Insights page, keep it lightweight.

Example:

```text
₹18,500
Sold This Month

₹2,450
Average Selling Price

3
Successful Sales
```

Tap:

```text
View Details
 ↓
Sell → Selling History
```

Do not build a second accounting system inside Insights.

---

# 21. Produce Insights

Optional:

```text
12 Quintals
Available

8 Quintals
Listed

5 Quintals
Sold
```

These values must reconcile with:

```text
My Farm → Produce
Sell → Listings
Orders / Sales
```

Do not calculate independent quantities on the client.

---

# 22. Auction Insights

Only display if auctions are actually enabled for the farmer.

Example:

```text
3 Active Auctions
Average Bid ₹2,480/q
5 Successful Sales
2 Unsold Quintals
```

If auctions are not in the current MVP:

```text
Hide the section.
```

Do not show empty auction analytics.

---

# 23. Bottom Navigation Actions

### Home

```text
Tap → Home
```

### My Farm

```text
Tap → My Farm
```

### Sell

```text
Tap → Sell
```

### Insights

```text
Tap → Insights
```

If already on Insights:

```text
Tap → Scroll to top
```

### Profile

```text
Tap → Profile
```

---

# 24. Notification Deep Links

```text
New Buyer Offer
 ↓
Sell → Offer Details

Listing Update
 ↓
Sell → Listing Details

Pickup Scheduled
 ↓
Orders → Order Details

Payment Received
 ↓
Orders → Payment Details

Market Alert
 ↓
Insights → Market Details
```

---

# 25. Canonical Destination Table

| Insights element | Action | Destination |
|---|---|---|
| Logo | Tap | No navigation |
| Notification | Tap | Notifications |
| Price Opportunity | Tap | Crop Market Details |
| View Details | Tap | Crop Market Details |
| Prediction | Tap | Prediction Details |
| Price Trend | Tap | Market/Crop Market Details |
| View Market | Tap | Market Prices |
| Price data point | Tap | Date/price detail |
| Price vs Market | Tap | Selling History / Comparison |
| View Details | Tap | Selling History / Comparison |
| Crop card | Tap | Crop Market Details |
| View All Crops | Tap | Crop Insights |
| Buyer Interest | Tap | Buyer Offers |
| View Offers | Tap | Sell → Buyer Offers |
| FarmPrism Insight | Tap | Recommendation Details |
| Sell This Crop | Tap | Sell → Create Listing |
| Earnings | Tap | Sell → Selling History |
| Bottom Home | Tap | Home |
| Bottom My Farm | Tap | My Farm |
| Bottom Sell | Tap | Sell |
| Bottom Insights | Tap | Insights |
| Bottom Profile | Tap | Profile |

---

# 26. Back Navigation

Follow the real navigation stack.

Examples:

```text
Insights
 ↓
Crop Market Details
 ↓
Back → Insights
```

```text
Insights
 ↓
Buyer Offers
 ↓
Back → Insights
```

```text
Insights
 ↓
Prediction Details
 ↓
Back → Insights
```

Do not force every Back action to Home.

---

# 27. Loading States

Use skeleton placeholders.

Do not show fake values while loading.

Examples:

```text
Price Opportunity
████████████
████████

Market Trend
████████████████

Buyer Interest
████████
```

---

# 28. Empty States

### No crop data

```text
Add crops in My Farm
to see personalized insights.

[ Go to My Farm ]
```

### No market data

```text
Market information is unavailable right now.

[ Try Again ]
```

### No selling history

```text
No completed sales yet.

Your price comparison will appear
after your first completed sale.
```

### No buyer interest

```text
No buyer interest yet.

Check your listings or list produce.
```

---

# 29. Error States

```text
We couldn't load your insights.

Please check your connection
and try again.

[ Try Again ]
```

A failure in one section should not necessarily block the entire page.

---

# 30. Stale Data

Market data should show freshness:

```text
Updated 30 min ago
```

Cached data:

```text
Showing data from 45 min ago
```

Never describe cached/stale data as live.

---

# 31. Animation

Keep animation subtle and consistent.

### Screen entry

```text
250–300ms
Fade + translateY 8–12dp
```

### Cards

Optional:

```text
40–60ms stagger
```

### Chart

Optional:

```text
300–500ms reveal
```

### Button press

```text
100–150ms
scale ≈ 0.97
```

Avoid:

```text
Bouncing cards
Animated leaves
Continuous background movement
Heavy parallax
Long transitions
```

---

# 32. Accessibility

Minimum interactive target:

**48 × 48 dp-equivalent**

Requirements:

- Icon-only controls need accessible labels.
- Price movement must not rely only on color.
- Charts need a text summary.
- Support larger text.
- Prevent price/number clipping.
- Decorative artwork should be marked decorative.
- Strings must be localization-ready.

Example chart accessibility text:

```text
Tomato prices increased from
₹1,650 to ₹2,400 per quintal
over the last 7 days.
```

---

# 33. Responsive Design

Reference:

```text
1080 × 2340 px
```

Do not hard-code these dimensions in React Native.

Use:

```text
Flexbox
useWindowDimensions()
Safe-area insets
ScrollView
Responsive widths
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

# 34. Data Ownership

Insights reads:

```text
Market Price
Price Prediction
Buyer Interest
Selling History
Crop
Produce
```

But ownership remains separated:

```text
My Farm
→ Farmer / Farm / Crop / Produce

Insights
→ Market / Prediction / Recommendation

Sell
→ Listings / Offers / Sales

Orders
→ Orders / Logistics / Payment
```

---

# 35. Backend Responsibilities

Backend should control:

- Market prices
- Price calculations
- Prediction
- Recommendation generation
- Buyer-interest aggregation
- Selling-history calculations
- Authorization
- Data freshness

The mobile client should render backend-provided business values.

---

# 36. Suggested Insight API

```ts
type InsightSummary = {
  farmerId: string;
  generatedAt: string;

  priceOpportunity?: {
    cropId: string;
    cropName: string;
    currentPrice: number;
    unit: string;
    changePercent?: number;
    demand?: "low" | "medium" | "high";
    prediction?: {
      lower: number;
      upper: number;
      unit: string;
      horizonDays?: number;
    };
  };

  sellingComparison?: {
    averageSellingPrice?: number;
    marketReferencePrice?: number;
    difference?: number;
    unit: string;
  };

  buyerInterest?: {
    cropId: string;
    buyerCount: number;
    highestOffer?: number;
    unit?: string;
  };

  crops?: Array<{
    cropId: string;
    cropName: string;
    currentPrice?: number;
    unit?: string;
    changePercent?: number;
    trend?: "up" | "down" | "stable";
  }>;

  recommendation?: {
    title: string;
    explanation: string;
    confidence?: "low" | "medium" | "high";
    generatedAt: string;
  };
};
```

Adapt to the existing FarmPrism schema.

---

# 37. Security

Backend must verify:

- Farmer owns the crop/produce.
- Selling history belongs to the farmer.
- Buyer-interest information is authorized.
- Offer information is authorized.
- Market values cannot be modified by the client.
- Prediction values cannot be forged by the client.

---

# 38. Suggested React Native Structure

```text
src/
├── screens/
│   └── farmer/
│       ├── InsightsScreen.tsx
│       ├── CropMarketDetailsScreen.tsx
│       ├── MarketPricesScreen.tsx
│       ├── PredictionDetailsScreen.tsx
│       └── RecommendationDetailsScreen.tsx
│
├── components/
│   └── insights/
│       ├── PriceOpportunityCard.tsx
│       ├── PriceTrendCard.tsx
│       ├── PriceComparisonCard.tsx
│       ├── CropInsightsCard.tsx
│       ├── BuyerInterestCard.tsx
│       └── FarmPrismInsightCard.tsx
│
└── services/
    ├── insightsService.ts
    ├── marketService.ts
    └── predictionService.ts
```

Adapt this to the existing project structure.

---

# 39. Performance

- Prefer a consolidated Insights response.
- Avoid one network request per card.
- Cache market data with freshness metadata.
- Lazy-load detailed charts/history.
- Avoid rendering unnecessary analytics below the fold.
- Compress artwork.
- Keep chart rendering lightweight.

---

# 40. Final UX Principle

Insights should not feel like an Excel report.

The farmer should understand:

```text
WHAT IS MY PRODUCE WORTH?
        ↓
HOW IS THE PRICE MOVING?
        ↓
WHAT DID I GET BEFORE?
        ↓
WHO WANTS MY PRODUCE?
        ↓
WHAT ARE THEY OFFERING?
        ↓
WHAT SHOULD I CONSIDER?
        ↓
SELL
```

FarmPrism should:

```text
INFORM
   ↓
SHOW OPPORTUNITIES
   ↓
MAKE COMPARISON EASY
   ↓
ENABLE BETTER SELLING DECISIONS
```

It should never present a prediction as guaranteed or replace the farmer's judgment.
