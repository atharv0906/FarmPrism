import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-service-role-key';
const { registerIntegrationRoutes } = await import('./integration.routes.js');
const { errorHandler } = await import('../middleware/error.middleware.js');
import type { AuthenticatedRequest } from '../middleware/auth.js';

test('price insight requires Farmer role and market rejects invalid crop', async t => {
  const app = express(); app.use(express.json());
  registerIntegrationRoutes(app, (req: AuthenticatedRequest, _res, next) => {
    req.demoSession = { accountId: '11111111-1111-4111-8111-111111111111', role: 'buyer', fullName: 'Buyer', phone: '', loginLabel: 'buyer1' };
    next();
  });
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  assert.equal((await fetch(base + '/api/farmer/price-insight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batchId: '11111111-1111-4111-8111-111111111111' }) })).status, 403);
  assert.equal((await fetch(base + '/api/market/Wheat/current')).status, 400);
});
