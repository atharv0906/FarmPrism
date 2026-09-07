# FarmPrism — Sell Page Data & API Notes

## Core entities

```text
Farmer
Farm
Crop
Produce
ProduceQuality
ProduceListing
Buyer
BuyerOffer
Order
LogisticsEvent
Payment
MarketPrice
PricePrediction
```

## Relationships

```text
Farmer 1 ── * Farm
Farm 1 ── * Crop
Crop 1 ── * Produce
Produce 1 ── * ProduceListing
ProduceListing 1 ── * BuyerOffer
Buyer 1 ── * BuyerOffer
BuyerOffer 0..1 ── 1 Order
Order 1 ── * LogisticsEvent
Order 1 ── 0..1 Payment
Crop / Produce ── * MarketPrice
Crop / Produce ── 0..* PricePrediction
Produce ── 0..1 ProduceQuality
```

## API responsibilities

### GET dashboard selling summary

Return:
- active listing count
- pending offer count
- relevant market prices
- eligible buyer opportunities

### POST listing

Server validates:
- farmer ownership
- crop/produce ownership
- quantity
- quality fields
- selling method

### GET listing offers

Return:
- buyer
- verification state
- price
- quantity
- terms
- pickup/delivery information
- offer status

### POST accept offer

Must be transactional:
1. Validate listing is active.
2. Validate offer is pending.
3. Validate farmer authorization.
4. Lock/revalidate available quantity.
5. Mark offer accepted.
6. Close/reconcile competing offers as required.
7. Create order.
8. Update produce/listing quantity.
9. Emit order/logistics event.

Do not perform this as multiple unprotected client-side mutations.

## Data freshness

Market price and prediction data should expose freshness metadata where available:

```ts
{
  value: 2400,
  unit: "quintal",
  source?: string,
  observedAt: string,
  expiresAt?: string
}
```

The UI should avoid presenting stale information as real-time information.

## Error handling

Recommended API error categories:

```text
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
INSUFFICIENT_QUANTITY
LISTING_NOT_ACTIVE
OFFER_NOT_AVAILABLE
CONFLICT
NETWORK_ERROR
SERVER_ERROR
```

Map these to farmer-friendly messages.
