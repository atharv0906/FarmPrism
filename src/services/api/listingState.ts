import type { SellingItem, Offer } from './trading.types';

export function listingExpired(item: Pick<SellingItem, 'status' | 'endsAt'>, now = Date.now()): boolean {
  return item.status === 'expired' || (['open', 'active', 'partially_sold', 'closed'].includes(item.status) && Date.parse(item.endsAt) <= now);
}
export function listingActive(item: Pick<SellingItem, 'status' | 'endsAt'>, now = Date.now()): boolean {
  return ['open', 'active', 'partially_sold'].includes(item.status) && Date.parse(item.endsAt) > now;
}
export function offerExpired(offer: Pick<Offer, 'kind' | 'status'>, item?: Pick<SellingItem, 'status' | 'endsAt'>): boolean {
  return offer.status === 'expired' || (offer.kind === 'auction' && !!item && listingExpired(item) && ['active', 'partially_accepted'].includes(offer.status));
}
export function offerActionable(offer: Pick<Offer, 'kind' | 'status' | 'remainingKg'>, item?: Pick<SellingItem, 'status' | 'endsAt'>): boolean {
  return !!item && offer.remainingKg > 0 && ['active', 'pending', 'partially_accepted'].includes(offer.status) &&
    // Fixed-price request policy is unchanged. Auction remainder expires at endsAt.
    (offer.kind === 'fixed' || (!offerExpired(offer, item) && ['open', 'partially_sold', 'closed'].includes(item.status) && Date.parse(item.endsAt) > Date.now()));
}
