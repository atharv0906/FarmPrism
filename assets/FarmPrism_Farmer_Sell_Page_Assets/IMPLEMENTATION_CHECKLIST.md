# FarmPrism — Sell Page Implementation Checklist

## Design
- [ ] 1080×2340 visual reference added.
- [ ] Individual PNG artwork added.
- [ ] No developer cropping from screenshot required.
- [ ] Logo uses supplied asset.
- [ ] Hero/background/callout are separate.
- [ ] Produce assets are separate.
- [ ] Banner/leaves are separate.

## React Native / Expo
- [ ] SellScreen implemented.
- [ ] Components separated by responsibility.
- [ ] Responsive layout.
- [ ] Safe-area handling.
- [ ] Scroll behavior.
- [ ] Accessibility labels.
- [ ] Localization-ready strings.

## Sell flow
- [ ] Select produce.
- [ ] Enter quantity.
- [ ] Validate available quantity.
- [ ] Add quality information.
- [ ] Add produce photos.
- [ ] Show market price.
- [ ] Show prediction when available.
- [ ] Select selling method.
- [ ] Review listing.
- [ ] Submit listing.
- [ ] Show success state.

## Offers
- [ ] Active listings.
- [ ] Offer list.
- [ ] Offer details.
- [ ] Compare offers.
- [ ] Accept offer.
- [ ] Prevent duplicate acceptance.
- [ ] Create order.

## Order
- [ ] Confirmed.
- [ ] Pickup scheduled.
- [ ] Picked up.
- [ ] In transit.
- [ ] Delivered.
- [ ] Payment completed.

## States
- [ ] Loading.
- [ ] Empty.
- [ ] Error.
- [ ] Missing market data.
- [ ] No offers.
- [ ] Missing artwork.

## Product rules
- [ ] No fake market prices.
- [ ] No fake buyer counts.
- [ ] Predictions are clearly predictions.
- [ ] Farmer-declared quality is not called verified.
- [ ] Server validates listing ownership and quantity.
- [ ] Server validates offer acceptance.
- [ ] Farmer remains in control of the final selling decision.
