import test from 'node:test';
import assert from 'node:assert/strict';
import { createFarmerSummaryService, type FarmerSummaryData, marketTrend } from './farmerSummary.service.js';
import type { Crop, MarketPoint } from '../types/market.js';

const now = new Date('2026-09-12T12:00:00Z');
const batch = (id: string, crop: Crop, remainingKg: number, status = 'available') => ({ id, crop, remainingKg, status, createdAt: '2026-08-01T00:00:00Z', updatedAt: '2026-09-10T00:00:00Z' });
const auction = (id: string, batchId: string, status = 'open', endsAt = '2026-09-13T00:00:00Z') => ({ id, batchId, remainingKg: 50, status, startsAt: '2026-09-11T00:00:00Z', endsAt });
const bid = (id: string, auctionId: string, pricePerKg: number, status = 'active') => ({ id, auctionId, pricePerKg, status, buyerId: id, quantityKg: 10 });
function fixture(): FarmerSummaryData {
  return {
    account: { id: 'farmer', name: 'Current Farmer' }, profile: { location: 'Wagholi, Pune, Maharashtra', area: 7.5 },
    batches: [batch('t1', 'Tomato', 123.5), batch('t2', 'Tomato', 10), batch('o', 'Onion', 7), batch('p', 'Potato', 0), batch('reserved', 'Potato', 80, 'reserved')],
    auctions: [auction('a', 't1'), auction('a2', 'o', 'partially_sold'), auction('expired', 't2', 'open', '2026-09-01T00:00:00Z'), auction('closed', 't2', 'closed')],
    bids: [bid('b1', 'a', 30), bid('b2', 'a', 31), bid('b3', 'a2', 40), bid('old', 'a2', 100, 'replaced'), bid('late', 'expired', 200), bid('fixed', 'fixed-listing', 1000)],
    orders: [
      { bidId: null, quantityKg: 10, total: 100, status: 'completed', completedAt: '2026-09-01T00:00:00Z' },
      { bidId: null, quantityKg: 10, total: 200, status: 'completed', completedAt: '2026-08-31T19:00:00Z' }, // September in India.
      { bidId: null, quantityKg: 10, total: 999, status: 'completed', completedAt: '2026-08-01T00:00:00Z' },
      { bidId: null, quantityKg: 10, total: 999, status: 'balance_pending', completedAt: null },
      { bidId: null, quantityKg: 10, total: 999, status: 'cancelled', completedAt: '2026-09-11T00:00:00Z' },
    ],
    notifications: [{ type: 'new_bid', readAt: null }, { type: 'bid_revised', readAt: null }, { type: 'purchase_request', readAt: null }, { type: 'new_bid', readAt: '2026-09-10T00:00:00Z' }],
  };
}
const point = (crop: Crop, at = '2026-09-12T00:00:00Z', price = 25): MarketPoint => ({ crop, mandi: 'Pune', district: 'Pune', state: 'Maharashtra', minPricePerKg: 20, modalPricePerKg: price, maxPricePerKg: 30, observedAt: at, source: 'data.gov.in / AGMARKNET', isDemo: false });
function service(data = fixture(), calls: unknown[] = []) {
  return createFarmerSummaryService({ read: async id => { assert.equal(id, 'farmer'); return data; } }, { history: async (crop, days, district) => {
    calls.push({ crop, days, district });
    return { crop: crop as Crop, days, points: [point(crop as Crop)], retrievedAt: now.toISOString(), fallback: false };
  } }, () => now);
}
test('Home reads current eligible inventory, profile, auctions, notifications and completed-month sales', async () => {
  const calls: unknown[] = [], home = await service(fixture(), calls).home('farmer');
  assert.equal(home.farm.availableQuantityKg, 140.5); assert.equal(home.farm.availableQuantity, 1.405);
  assert.equal(home.farm.cropCount, 3); assert.equal(home.farm.totalAcres, 7.5); assert.equal(home.farmer.name, 'Current Farmer');
  assert.deepEqual(home.sellingActivity, { currency: 'INR', activeAuctions: 2, newOffers: 2, soldThisMonth: 300 });
  assert.equal(home.notifications.unreadCount, 3);
  assert.deepEqual(calls, ['Tomato', 'Onion', 'Potato'].map(crop => ({ crop, days: 30, district: 'Pune' })));
  assert.ok(home.marketPrices.every(p => p.pricePerQuintal === 2500 && p.changePercent === 0));
});
test('Top Opportunity selects highest current auction bid; fixed, replaced, expired and fully allocated bids cannot win', async () => {
  const data = fixture();
  let home = await service(data).home('farmer');
  assert.equal(home.topOpportunity?.auctionId, 'a2'); assert.equal(home.topOpportunity?.highestOfferPerQuintal, 4000);
  assert.equal(home.topOpportunity?.marketReferencePerQuintal, 2500); assert.equal(home.topOpportunity?.differencePerQuintal, 1500);
  data.orders.push({ bidId: 'b3', quantityKg: 10, total: 400, status: 'logistics_pending', completedAt: null });
  home = await service(data).home('farmer');
  assert.equal(home.topOpportunity?.auctionId, 'a'); assert.equal(home.topOpportunity?.buyerCount, 2);
  data.bids = data.bids.filter(b => !['b1', 'b2'].includes(b.id));
  assert.equal((await service(data).home('farmer')).topOpportunity, null);
});
test('My Farm groups current physical batches, uses actual timestamp activity and changes with inventory', async () => {
  const data = fixture(); data.batches[1].updatedAt = '2026-08-01T00:00:00Z';
  const summaries = service(data); let farm = await summaries.myFarm('farmer');
  assert.equal(farm.farm.name, null); assert.equal(farm.farm.areaUnit, 'acre');
  assert.deepEqual(farm.summary, { cropCount: 3, totalAvailableKg: 140.5, activeBatchCount: 3 });
  assert.deepEqual(farm.crops.map(c => [c.name, c.availableKg, c.batchCount, c.status]), [['Tomato', 133.5, 2, 'active'], ['Onion', 7, 1, 'active'], ['Potato', 0, 0, 'inactive']]);
  assert.deepEqual(farm.activities, { cropsAdded: 3, updatesThisMonth: 4 });
  data.batches[0].remainingKg = 1;
  farm = await summaries.myFarm('farmer'); assert.equal(farm.summary.totalAvailableKg, 18);
});
test('Farmer with no batches and zero remaining inventory yields honest empty/zero states', async () => {
  const data = fixture(); data.batches = []; data.auctions = []; data.bids = [];
  let farm = await service(data).myFarm('farmer');
  assert.deepEqual(farm.summary, { cropCount: 0, totalAvailableKg: 0, activeBatchCount: 0 }); assert.deepEqual(farm.crops, []);
  assert.deepEqual(farm.activities, { cropsAdded: 0, updatesThisMonth: 0 });
  data.batches = [batch('t', 'Tomato', 0)]; farm = await service(data).myFarm('farmer');
  assert.equal(farm.summary.totalAvailableKg, 0); assert.equal(farm.crops[0].status, 'inactive');
});
test('trend compares earlier same-market observations only; no market data invents no price', async () => {
  const latest = point('Tomato');
  assert.equal(marketTrend([{ ...point('Tomato', '2026-09-11T00:00:00Z', 1), mandi: 'Other' }], latest), 0);
  assert.equal(marketTrend([point('Tomato', '2026-09-11T00:00:00Z', 20)], latest), 25);
  const home = await createFarmerSummaryService({ read: async () => fixture() }, { history: async () => { throw new Error('offline'); } }, () => now).home('farmer');
  assert.deepEqual(home.marketPrices, []); assert.equal(home.topOpportunity?.marketReferencePerQuintal, null);
});
