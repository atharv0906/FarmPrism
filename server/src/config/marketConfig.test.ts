import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMarketConfig } from './marketConfig.js';

test('market defaults, canonical key precedence and deprecated key fallback', () => {
  assert.deepEqual(parseMarketConfig({}), { provider: 'data_gov', apiBaseUrl: 'https://api.data.gov.in/resource', apiKey: '', resourceId: '', limit: 100, timeoutMs: 10000 });
  assert.equal(parseMarketConfig({ MARKET_API_KEY: ' canonical ', DATA_GOV_IN_API_KEY: 'legacy' }).apiKey, 'canonical');
  for (const value of [undefined, '', '  ']) assert.equal(parseMarketConfig({ MARKET_API_KEY: value, DATA_GOV_IN_API_KEY: 'legacy' }).apiKey, 'legacy');
});
test('invalid market configuration fails with safe variable-specific errors', () => {
  for (const [key, values] of Object.entries({ MARKET_PROVIDER: ['secret-unsupported'], MARKET_API_BASE_URL: ['http://example.com', 'invalid', 'https://user:secret@example.com', 'https://example.com?api-key=secret'], MARKET_API_LIMIT: ['0', '-1', '1.5', '1001', 'Infinity'], MARKET_API_TIMEOUT_MS: ['0', '-1', '1.5', '60001'] })) {
    for (const value of values) assert.throws(() => parseMarketConfig({ [key]: value, MARKET_API_KEY: 'secret-key' }), error => error instanceof Error && error.message.includes(key) && !error.message.includes('secret'));
  }
});
