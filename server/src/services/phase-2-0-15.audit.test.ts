import test from 'node:test';
import assert from 'node:assert/strict';
import { createMarketService } from './market.service.js';
import { parseMarketConfig } from '../config/marketConfig.js';

// Expected-behavior regression: intentionally fails until AUD-01 is fixed.
test('AUD-01 batched history retains valid official observations during DB outage', async () => {
  const service = createMarketService({
    history: async () => { throw new Error('Mock DB outage'); },
    historyMany: async () => { throw new Error('Mock DB outage'); },
  }, parseMarketConfig({ MARKET_API_KEY: 'test-only', MARKET_RESOURCE_ID: 'test-resource' }),
  (async () => new Response(JSON.stringify({ records: [{ commodity: 'Tomato', market: 'Pune', district: 'Pune', state: 'Maharashtra', arrival_date: '12/09/2026', min_price: '2000', modal_price: '2500', max_price: '3000' }] }))) as typeof fetch);
  const histories = await service.historyMany(['Tomato'], 30, 'Pune');
  assert.equal(histories[0].points[0].modalPricePerKg, 25);
  assert.equal(histories[0].fallback, false);
});
