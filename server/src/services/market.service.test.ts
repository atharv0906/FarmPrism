import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketService, normalizeGovernmentRow, recommendPrice, contextualModifier } from './market.service.js';
import { configuredPriceAiProvider } from './priceAi.provider.js';
import type { MarketHistory, MarketPoint } from '../types/market.js';

import { parseMarketConfig } from '../config/marketConfig.js';
const config = (key = 'test-key') => parseMarketConfig({ MARKET_API_KEY: key, MARKET_RESOURCE_ID: 'configured-resource' });

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
    const history = await createMarketService(repository, config(key), outage).history('Tomato', 30);
    assert.equal(history.fallback, true);
    assert.equal(history.points[0].isDemo, true);
    assert.equal(JSON.stringify(history).includes('test-key'), false);
  }
});
test('official data survives DB outage and credentials never enter output', async () => {
  const repository = { history: async (): Promise<MarketPoint[]> => { throw new Error('DB unavailable'); } };
  const fetcher = (async () => new Response(JSON.stringify({ records: [remote] }))) as typeof fetch;
  const history = await createMarketService(repository, config('secret-key'), fetcher).history('Tomato', 30, 'Pune');
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
  const result = await createMarketService(repository, config('private-key'), fetcher).history('Tomato', 30);
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

test('official requests use all configured settings and Maharashtra/district filters', async t => {
  const cfg = parseMarketConfig({ MARKET_API_BASE_URL: 'https://market.example/resource/', MARKET_RESOURCE_ID: 'my-resource', MARKET_API_KEY: 'private-key', MARKET_API_LIMIT: '37', MARKET_API_TIMEOUT_MS: '1234' });
  const durations: number[] = [];
  t.mock.method(AbortSignal, 'timeout', (ms: number) => { durations.push(ms); return new AbortController().signal; });
  const logs: unknown[] = [];
  for (const method of ['log', 'warn', 'error'] as const) t.mock.method(console, method, (...args: unknown[]) => logs.push(args));
  let requests = 0;
  const fetcher = (async (input: URL | RequestInfo, init?: RequestInit) => {
    requests++;
    const url = new URL(String(input));
    assert.equal(url.origin + url.pathname, 'https://market.example/resource/my-resource');
    assert.equal(url.searchParams.get('api-key'), 'private-key');
    assert.equal(url.searchParams.get('limit'), '37');
    assert.equal(url.searchParams.get('format'), 'json');
    assert.equal(url.searchParams.get('filters[commodity]'), 'Tomato');
    assert.equal(url.searchParams.get('filters[state.keyword]'), 'Maharashtra');
    assert.equal(url.searchParams.get('filters[district]'), 'Pune');
    assert.equal(init?.redirect, 'error');
    return new Response(JSON.stringify({ records: [remote, { ...remote, state: 'Gujarat' }, { ...remote, district: 'Nashik' }, { ...remote, market: 'private-key' }] }));
  }) as typeof fetch;
  const result = await createMarketService({ history: async () => [] }, cfg, fetcher).history('Tomato', 30, 'Pune');
  assert.equal(requests, 1); assert.deepEqual(durations, [1234]);
  assert.equal(result.points.length, 1);
  assert.equal(JSON.stringify([result, logs]).includes('private-key'), false);
});

test('missing key or resource skips official request; legacy key is used in request', async () => {
  let calls = 0;
  const fetcher = (async (input: URL | RequestInfo) => {
    calls++; assert.equal(new URL(String(input)).searchParams.get('api-key'), 'legacy');
    return new Response(JSON.stringify({ records: [remote] }));
  }) as typeof fetch;
  for (const cfg of [config(''), parseMarketConfig({ MARKET_API_KEY: 'key' })]) {
    const result = await createMarketService({ history: async () => [point] }, cfg, fetcher).history('Tomato', 30);
    assert.equal(result.fallback, true);
  }
  assert.equal(calls, 0);
  await createMarketService({ history: async () => [] }, parseMarketConfig({ DATA_GOV_IN_API_KEY: 'legacy', MARKET_RESOURCE_ID: 'resource' }), fetcher).history('Tomato', 30, 'Pune');
  assert.equal(calls, 1);
});

test('all three crops normalize; invalid dates and price relationships are rejected', () => {
  for (const crop of ['Tomato', 'Onion', 'Potato'] as const) {
    const row = { ...remote, commodity: crop };
    assert.equal(normalizeGovernmentRow(row, crop)?.modalPricePerKg, 25);
    for (const bad of [{ arrival_date: 'invalid' }, { arrival_date: '2026-02-31' }, { min_price: '0' }, { max_price: '-100' }, { min_price: '2600' }, { max_price: '2400' }]) {
      assert.equal(normalizeGovernmentRow({ ...row, ...bad }, crop), null);
    }
  }
});

test('grade, demand and lot adjustments follow exact policy with a three-percent bound', async () => {
  for (const grade of ['A', 'B', 'C', null] as const) for (const demand of ['low', 'moderate', 'high'] as const) for (const kg of [1, 499.99, 500, 999.99, 1000, 1000000]) {
    const value = contextualModifier(kg, grade, demand);
    assert.ok(value >= -0.03 && value <= 0.03);
  }
  assert.equal(contextualModifier(499.99, 'B', 'low'), 0);
  assert.equal(contextualModifier(500, 'B', 'low'), -0.005);
  assert.equal(contextualModifier(999.99, 'B', 'low'), -0.005);
  assert.equal(contextualModifier(1000, 'B', 'low'), -0.01);
  assert.equal(contextualModifier(100, 'A', 'high'), 0.03);
  assert.equal(contextualModifier(100, null, 'moderate'), 0.005);
  const history: MarketHistory = { crop: 'Tomato', days: 30, points: [{ ...point, modalPricePerKg: 100 }], retrievedAt: point.observedAt, fallback: true };
  const price = async (grade: 'A' | 'B' | 'C', demand = 0, kg = 100) => (await recommendPrice(history, kg, grade, demand)).recommendation;
  const a = await price('A'), b = await price('B'), c = await price('C'), high = await price('B', 11), large = await price('B', 0, 1000);
  assert.ok(a.suggestedMinPricePerKg > b.suggestedMinPricePerKg);
  assert.ok(c.suggestedMinPricePerKg < b.suggestedMinPricePerKg);
  assert.ok(high.suggestedMinPricePerKg > b.suggestedMinPricePerKg);
  assert.ok(large.suggestedMinPricePerKg < b.suggestedMinPricePerKg);
  for (const result of [a, c, high, large]) for (const key of ['suggestedMinPricePerKg', 'suggestedMaxPricePerKg'] as const) assert.ok(Math.abs(result[key] / b[key] - 1) <= 0.0301);
  const failedAi = await recommendPrice(history, 100, 'B', 0, { explainRecommendation: async () => { throw new Error('offline'); } });
  assert.deepEqual(failedAi.recommendation, b);
});

test('current observation provenance is independent of historical demo context', async () => {
  const live = normalizeGovernmentRow({ ...remote, arrival_date: '10/09/2026' }, 'Tomato')!;
  const history: MarketHistory = { crop: 'Tomato', days: 30, points: [point, live], retrievedAt: point.observedAt, fallback: false };
  const result = await recommendPrice(history, 100, 'B', 0);
  assert.equal(result.market.isDemo, false);
  assert.equal(result.market.source, 'data.gov.in / AGMARKNET');
  assert.equal(result.recommendation.confidence, 'low');
});
