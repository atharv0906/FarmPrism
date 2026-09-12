# FarmPrism — Sell Page System Design & Workflow

## 1. Product role

The Sell module is the transaction entry point of FarmPrism.

FarmPrism does not primarily tell farmers how to farm. It helps farmers understand the value of their produce, find verified buyers, compare offers and sell directly with greater transparency.

### Core loop

KNOW → DECIDE → SELL DIRECTLY → GET BETTER VALUE

### Sell module loop

SELECT PRODUCE
→ QUANTITY
→ QUALITY
→ MARKET PRICE
→ PRICE PREDICTION
→ SELLING METHOD
→ REVIEW
→ LIST
→ BUYER OFFERS
→ COMPARE OFFERS
→ ACCEPT
→ ORDER
→ LOGISTICS
→ PAYMENT

---

## 2. Sell Home

The Sell tab should answer three questions immediately:

1. What can I sell?
2. What is it worth?
3. What offers/listings are already active?

### Recommended hierarchy

1. Header / hero
2. List New Produce CTA
3. Quick Sell Options
4. Today's Market Price
5. Active Listings
6. Why Sell on FarmPrism
7. Brand banner
8. Bottom navigation

Keep the page readable. Do not turn it into a complex analytics screen.

---

## 3. List Produce workflow

### Step 1 — Select produce

```text
Sell
 ↓
List Produce
 ↓
Select Crop / Produce
```

Show only crops associated with the farmer, plus an `Other Crop` path if supported.

Example:

```text
Tomato
Onion
Potato
Other Crop
```

### Step 2 — Quantity

```text
How much do you want to sell?

Quantity: 8
Unit: Quintals

Available: 12 Quintals
```

Never allow the listing quantity to exceed available produce.

### Step 3 — Quality

Quality belongs in the selling flow because buyer trust and price depend on produce quality.

MVP fields:

- Farmer-declared grade
- Visible quality notes
- Produce photos
- Optional quality attributes appropriate to the crop

Do not call farmer-declared quality “FarmPrism Verified”.

Possible states:

- Farmer Declared
- FarmPrism Verified
- Buyer Accepted

### Step 4 — Market information

Show current market context:

```text
Current market price
₹2,400 / Quintal

Reference / mandi price
₹2,350 / Quintal
```

The farmer should understand the market before choosing a listing price.

### Step 5 — Price prediction

Show a predicted range where data is available:

```text
FarmPrism Price Insight

Possible range
₹2,500 – ₹2,650 / Quintal
```

This is informational, not a command.

Avoid forcing “sell now” or “wait”.

### Step 6 — Selling method

Depending on the final business rules:

- Direct buyer offer
- Buyer marketplace listing
- Auction

The UI must make the chosen method explicit.

### Step 7 — Review

Show:

- Crop
- Quantity
- Quality
- Photos
- Asking/listing price
- Market reference
- Selling method
- Expected availability / pickup information if required

Primary CTA:

`List Produce`

### Step 8 — Success

After successful listing:

```text
Produce Listed Successfully

Your listing is now visible to eligible buyers.

[ View Listing ]
[ Back to Sell ]
```

---

## 4. Buyer offer workflow

```text
Sell
 ↓
Your Listings
 ↓
View Offers
 ↓
Offer Details
 ↓
Compare Offers
 ↓
Accept Offer
 ↓
Order Created
```

Offer comparison should prioritize:

- Buyer identity/name
- Verification status
- Offered price
- Quantity requested
- Payment terms
- Pickup/delivery timing
- Any relevant conditions

Example:

```text
Buyer A
₹2,550 / Quintal
Verified
Payment: 100% after delivery

Buyer B
₹2,500 / Quintal
Verified
Payment: 50% advance
```

Do not rank an offer by price alone if other important terms materially differ.

---

## 5. Order handoff

After the farmer accepts an offer:

```text
Offer Accepted
 ↓
Order Created
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

Logistics is a separate role in FarmPrism. The farmer sees the order/delivery status, while logistics handles operational fulfillment.

---

## 6. Sell Home interactions

### List Produce

→ `Create Listing`

### Quick crop tile

→ Opens listing form with crop preselected

### Market Price

→ `Insights / Market Prices`

### Active Listing

→ `Listing Details`

### View Offers

→ `Buyer Offers`

### New Offer

→ `Offer Details`

### My Orders

→ `Orders`

### Learn More

→ Explain FarmPrism's verified buyers, transparent pricing and direct trading model.

---

## 7. Data model

Suggested TypeScript structures:

```ts
type ProduceListing = {
  id: string;
  farmerId: string;
  cropId: string;
  cropName: string;
  quantity: number;
  unit: string;
  quality?: {
    status: "farmer_declared" | "farmprism_verified" | "buyer_accepted";
    grade?: string;
    notes?: string;
    photoUrls?: string[];
  };
  listingPrice?: number;
  marketReferencePrice?: number;
  prediction?: {
    lower: number;
    upper: number;
    unit: string;
  };
  sellingMethod: "direct" | "marketplace" | "auction";
  status: "draft" | "active" | "pending" | "sold" | "expired" | "cancelled";
  createdAt: string;
};

type BuyerOffer = {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  verified: boolean;
  quantity: number;
  offeredPrice: number;
  unit: string;
  paymentTerms?: string;
  pickupDate?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
};

type Order = {
  id: string;
  listingId: string;
  acceptedOfferId: string;
  farmerId: string;
  buyerId: string;
  quantity: number;
  pricePerUnit: number;
  status:
    | "confirmed"
    | "pickup_scheduled"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "payment_completed";
};
```

Adapt these types to the existing FarmPrism backend schema.

---

## 8. Component architecture

Suggested React Native / Expo structure:

```text
src/
├── screens/
│   └── farmer/
│       ├── SellScreen.tsx
│       ├── CreateListingScreen.tsx
│       ├── ListingReviewScreen.tsx
│       ├── ListingSuccessScreen.tsx
│       ├── BuyerOffersScreen.tsx
│       ├── OfferDetailsScreen.tsx
│       ├── CompareOffersScreen.tsx
│       └── OrderDetailsScreen.tsx
│
├── components/
│   └── sell/
│       ├── SellHeader.tsx
│       ├── ListProduceCard.tsx
│       ├── QuickSellGrid.tsx
│       ├── MarketPriceSection.tsx
│       ├── ListingCard.tsx
│       ├── BuyerOfferCard.tsx
│       ├── QualitySection.tsx
│       ├── PricePredictionCard.tsx
│       ├── OfferComparison.tsx
│       └── SellBrandBanner.tsx
│
├── models/
│   ├── produce.ts
│   ├── listing.ts
│   ├── offer.ts
│   └── order.ts
│
├── repositories/
├── services/
├── theme/
└── assets/
    └── 10. FarmPrism_Sell_Page_Assets/
```

Follow the project's existing architecture if it differs.

---

## 9. State handling

### Loading

Use skeleton cards and placeholders.

### No available produce

```text
No produce ready to sell yet.

Add or update a crop in My Farm first.

[ Go to My Farm ]
```

### No listings

```text
You don't have any active listings.

[ List Produce ]
```

### No offers

```text
No offers yet.

Your listing is visible to eligible buyers.
```

### Market data unavailable

```text
Market price unavailable right now.

Try again later.
```

Never use fake `₹0` data.

### Network error

```text
We couldn't load your selling data.

[ Try Again ]
```

If cached data exists, show it with an appropriate stale-data indication.

---

## 10. Animation specification

Keep animation subtle.

### Screen entry
250–300ms:
- opacity 0 → 1
- translateY 8–12dp → 0

### Card press
100–150ms:
- scale approximately 0.97 → 1

### Listing success
A short confirmation animation is acceptable:
- checkmark fade/scale
- 250–400ms

### Offers updating
Use a small cross-fade or value transition.

### Avoid

- Continuous animated scenery
- Bouncing buttons
- Parallax-heavy hero effects
- Animated decorative leaves
- Long blocking animations

Use React Native `Animated` for simple motion, or the project's existing Reanimated setup if already present.

---

## 11. Responsive rules

Design reference:

`1080 × 2340 px`

Runtime:

- Use React Native logical layout units.
- Use `useWindowDimensions()` or project-standard responsive utilities.
- Use flexbox rather than fixed 1080px runtime dimensions.
- Maintain approximately 20–24dp side padding.
- Keep touch targets at least 48×48dp-equivalent.
- Bottom navigation must respect Android safe-area/system insets.
- Allow the page to scroll vertically.
- Support larger text sizes without clipping.

---

## 12. Accessibility

- Every icon-only action needs an accessible label.
- Do not communicate price trends by color alone.
- Use text + arrow/icon for up/down movement.
- Mark decorative artwork as decorative.
- Support font scaling.
- Use localization keys for user-facing strings.
- Format Indian currency and units from data.
- Ensure crop names and large prices do not overflow.

---

## 13. Security and business rules

Client-side validation is not enough.

The backend must verify:

- Farmer owns the produce/listing.
- Listing quantity does not exceed available quantity.
- Buyer is eligible/verified according to business rules.
- Offer belongs to the listing.
- Farmer is authorized to accept the offer.
- Accepted offer cannot be accepted twice.
- Order is created atomically after acceptance.
- Payment/order state transitions are validated server-side.

Never trust price, quantity or buyer verification status sent only by the client.

---

## 14. Database / API flow

Recommended logical flow:

```text
Farmer
  ↓
Farm
  ↓
Crop
  ↓
Produce / Available Quantity
  ↓
Produce Listing
  ↓
Buyer Offers
  ↓
Accepted Offer
  ↓
Order
  ↓
Logistics
  ↓
Payment
```

Market information and price prediction are supporting services:

```text
Crop / Produce
   ├── Market Price Service
   └── Price Prediction Service
```

Quality is associated with the produce/listing:

```text
Produce
 ↓
Quality Record
 ↓
Listing
```

---

## 15. Key business invariant

FarmPrism must never allow the UI to imply that:

- A farmer-declared grade is verified.
- A predicted price is guaranteed.
- A buyer interest count is real when data is unavailable.
- A market price is current when the data is stale without indicating that.
- A listing is sold before an accepted offer/order exists.

Transparency is more important than making the dashboard look impressive.

---

## 16. Acceptance checklist

```text
☐ Sell is accessible from bottom navigation.

☐ Sell is implemented in React Native / Expo.

☐ 1080×2340 reference is measurement-only.

☐ Individual artwork assets are used separately.

☐ No screenshot cropping is required by the developer.

☐ Dynamic text/data is rendered in React Native.

☐ Farmer's available crops are dynamic.

☐ Quantity validation works.

☐ Quality flow exists.

☐ Farmer-declared quality is not mislabeled as verified.

☐ Market price is dynamic.

☐ Price prediction is optional and clearly presented as a prediction.

☐ Listing review works.

☐ Listing success works.

☐ Active listings load dynamically.

☐ Buyer offers load dynamically.

☐ Offers can be compared.

☐ Offer acceptance creates an order.

☐ Order transitions connect to logistics.

☐ Payment completion is represented only after the appropriate backend event.

☐ Loading state works.

☐ Empty state works.

☐ Error state works.

☐ No fake ₹0 or fake buyer counts.

☐ Safe-area handling works.

☐ Large text does not clip.

☐ Touch targets meet accessibility requirements.

☐ Animations are subtle.

☐ Business/security rules are enforced server-side.
```

---

## 17. Final UX rule

The farmer should never feel that they are filling out a complicated marketplace form.

The experience should feel like:

```text
I have produce
      ↓
I choose it
      ↓
I tell FarmPrism how much
      ↓
I provide simple quality information
      ↓
I see what it is worth
      ↓
I see buyer interest/offers
      ↓
I compare
      ↓
I choose
      ↓
FarmPrism handles the transaction workflow
```

**The farmer remains in control of the decision.**
