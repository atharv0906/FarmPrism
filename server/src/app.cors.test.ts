import test from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-only';
const { createApp } = await import('./app.js');

test('development CORS preserves tester origins and permits authenticated farm PATCH', async t => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve)); t.after(() => server.close());
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  for (const origin of ['http://localhost:8081', 'http://localhost:8082', 'http://127.0.0.1:8081', 'http://127.0.0.1:8082']) {
    const response = await fetch(base + '/api/farmer/farm', { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'PATCH' } });
    assert.equal(response.status, 204); assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(response.headers.get('access-control-allow-methods'), 'GET, POST, PATCH, OPTIONS');
    assert.match(response.headers.get('access-control-allow-headers')!, /Authorization/);
  }
  const rejected = await fetch(base, { method: 'OPTIONS', headers: { Origin: 'https://untrusted.example' } });
  assert.equal(rejected.headers.get('access-control-allow-origin'), null);
  for (const endpoint of ['crops', 'batches', 'farm']) {
    assert.equal((await fetch(base + '/api/farmer/' + endpoint, { method: endpoint === 'farm' ? 'PATCH' : 'POST' })).status, 401);
  }
});
