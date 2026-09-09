import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketService, normalizeGovernmentRow, recommendPrice } from './market.service.js';
import { configuredPriceAiProvider } from './priceAi.provider.js';
import type { MarketHistory, MarketPoint } from '../types/market.js';

const point: MarketPoint = { crop: 'Tomato', mandi: 'Pune', district: 'Pune', state: 'Maharashtra',
  minPricePerKg: 20, maxPricePerKg: 30, modalPricePerKg: 25, observedAt: '2026-09-09T00:00:00.000Z', source: 'prototype_seed', isDemo: true };
const remote = { commodity: 'Tomato', market: 'Pune', district: 'Pune', state: 'Maharashtra', arrival_date: '09/09/2026', min_price: '2000', max_price: '3000', modal_price: '2500' };
test('government prices normalize INR per quintal to INR per KG', () => {
  const row = normalizeGovernmentRow(remote, 'Tomato');
  assert.equal(row?.modalPricePerKg, 25);
  assert.equal(row?.minPricePerKg, 20);
  assert.equal(row?.maxPricePerKg, 30);
  assert.equal(row?.isDemo, false);
  assert.equal(row?.observedAt, point.observedAt);
  assert.equal(normalizeGovernmentRow({ ...remote, arrival_date: '31/02/2026' }, 'Tomato'), null);
  assert.equal(normalizeGovernmentRow({ ...remote, modal_price: '-1' }, 'Tomato'), null);
  assert.equal(normalizeGovernmentRow({ ...remote, min_price: '' }, 'Tomato'), null);
  assert.equal(normalizeGovernmentRow(remote, 'Potato'), null);
});
test('remote outage and missing credentials fall back to honest DB observations', async () => {
  const repository = { history: async () => [point] };
  const outage = (async () => { throw new Error('secret request URL'); }) as typeof fetch;
  for (const key of ['', 'test-key']) {
    const history = await createMarketService(repository, key, outage).history('Tomato', 30);
    assert.equal(history.fallback, true);
    assert.equal(history.points[0].isDemo, true);
    assert.equal(JSON.stringify(history).includes('test-key'), false);
  }
});
test('official data survives DB outage and credentials never enter output', async () => {
  const repository = { history: async (): Promise<MarketPoint[]> => { throw new Error('DB unavailable'); } };
  const fetcher = (async () => new Response(JSON.stringify({ records: [remote] }))) as typeof fetch;
  const history = await createMarketService(repository, 'secret-key', fetcher).history('Tomato', 30, 'Pune');
  assert.equal(history.points[0].modalPricePerKg, 25);
  assert.equal(history.fallback, false);
  assert.equal(JSON.stringify(history).includes('secret-key'), false);
});
test('official cache receives normalized data and cache failure does not break market reads', async () => {
  let cached: MarketPoint[] = [];
  const repository = {
    history: async () => [],
    cache: async (points: MarketPoint[]) => { cached = points; throw new Error('Cache offline'); },
  };
  const fetcher = (async () => new Response(JSON.stringify({ records: [remote] }))) as typeof fetch;
  const result = await createMarketService(repository, 'private-key', fetcher).history('Tomato', 30);
  assert.equal(cached[0].modalPricePerKg, 25);
  assert.equal(cached[0].isDemo, false);
  assert.equal(result.points[0].modalPricePerKg, 25);
  assert.equal(JSON.stringify(cached).includes('private-key'), false);
});
test('invalid crop is rejected before fetching', async () => {
  await assert.rejects(createMarketService({ history: async () => [] }).history('Wheat', 30), { status: 400 });
});
test('statistical recommendation is bounded, positive and honest without AI', async () => {
  const history: MarketHistory = { crop: 'Tomato', days: 90, points: [point, { ...point, modalPricePerKg: 0.01, observedAt: '2026-09-10T00:00:00.000Z' }], retrievedAt: point.observedAt, fallback: true };
  const result = await recommendPrice(history, 100, 'A', 3);
  assert.equal(result.horizonDays, 7);
  assert.equal(result.recommendation.mode, 'statistical_fallback');
  assert.ok(result.recommendation.suggestedMinPricePerKg > 0);
  assert.ok(result.recommendation.suggestedMaxPricePerKg >= result.recommendation.suggestedMinPricePerKg);
  assert.equal(result.recommendation.confidence, 'low');
  assert.equal(result.quality.source, 'farmer_declared');
});
test('invalid or unavailable AI falls back and cannot change prices', async () => {
  const history: MarketHistory = { crop: 'Tomato', days: 30, points: [point], retrievedAt: point.observedAt, fallback: true };
  const invalid = await recommendPrice(history, 100, 'B', 0, { explainRecommendation: async () => ({ reasoning: 'Guaranteed price tomorrow.' }) });
  assert.equal(invalid.recommendation.mode, 'statistical_fallback');
  const valid = await recommendPrice(history, 100, 'B', 0, { explainRecommendation: async () => ({ reasoning: 'Recent observations suggest a cautious selling range based on the supplied moving averages.' }) });
  assert.equal(valid.recommendation.mode, 'ai_assisted');
  assert.equal(valid.recommendation.suggestedMinPricePerKg, invalid.recommendation.suggestedMinPricePerKg);
  assert.equal(configuredPriceAiProvider({}), undefined);
});
