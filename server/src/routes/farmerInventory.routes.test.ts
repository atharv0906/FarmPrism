import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { errorHandler } from '../middleware/error.middleware.js';
import { createFarmerInventoryService } from '../services/farmerInventory.service.js';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-only';
const { registerFarmerInventoryRoutes } = await import('./farmerInventory.routes.js');
test('all farm writes enforce missing session, role, strict input and authenticated ownership', async t => {
  const ids: string[] = [];
  const service = createFarmerInventoryService({ batches: async id => { ids.push(id); return []; }, insert: async () => { throw new Error('not needed'); }, update: async id => { ids.push(id); } });
  const app = express(); app.use(express.json());
  registerFarmerInventoryRoutes(app, service, (req: AuthenticatedRequest, res, next) => {
    if (!req.headers.authorization) { res.sendStatus(401); return; }
    req.demoSession = { accountId: 'trusted', role: req.headers.authorization === 'Bearer farmer' ? 'farmer' : 'buyer', phone: '', loginLabel: '', fullName: '' }; next();
  }); app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(r => server.once('listening', r)); t.after(() => server.close());
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  for (const endpoint of ['crops', 'batches', 'farm']) {
    const method = endpoint === 'farm' ? 'PATCH' : 'POST';
    assert.equal((await fetch(base + '/api/farmer/' + endpoint, { method })).status, 401);
    assert.equal((await fetch(base + '/api/farmer/' + endpoint, { method, headers: { Authorization: 'Bearer buyer' } })).status, 403);
    assert.equal((await fetch(base + '/api/farmer/' + endpoint, { method, headers: { Authorization: 'Bearer farmer', 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId: 'other' }) })).status, 400);
  }
  const response = await fetch(base + '/api/farmer/farm?accountId=other', { method: 'PATCH', headers: { Authorization: 'Bearer farmer', 'Content-Type': 'application/json' }, body: JSON.stringify({ locationLabel: 'Pune' }) });
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store'); assert.deepEqual(ids, ['trusted']);
});
