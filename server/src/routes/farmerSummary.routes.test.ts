import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { AuthenticatedRequest } from '../middleware/auth.js';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-service-role-key';
const { registerFarmerSummaryRoutes } = await import('./farmerSummary.routes.js');
const { createFarmerSummaryService } = await import('../services/farmerSummary.service.js');

test('Farmer summaries reject no token/wrong role and use only the authenticated account', async t => {
  const ids: string[] = [];
  const service = createFarmerSummaryService({ read: async id => {
    ids.push(id); return { account: { id, name: 'Farmer' }, profile: { location: '', area: null }, batches: [], auctions: [], bids: [], orders: [], notifications: [] };
  } }, { history: async () => { throw new Error('offline'); } });
  const app = express();
  registerFarmerSummaryRoutes(app, service, (req: AuthenticatedRequest, res, next) => {
    if (!req.headers.authorization) { res.sendStatus(401); return; }
    req.demoSession = { accountId: 'trusted-farmer', role: req.headers.authorization === 'Bearer buyer' ? 'buyer' : 'farmer', phone: '', loginLabel: '', fullName: '' }; next();
  });
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  for (const endpoint of ['home-summary', 'my-farm-summary']) {
    const url = base + '/api/farmer/' + endpoint;
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await fetch(url, { headers: { Authorization: 'Bearer buyer' } })).status, 403);
    const response = await fetch(url + '?accountId=other&phone=other', { headers: { Authorization: 'Bearer farmer' } });
    assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.deepEqual(ids, ['trusted-farmer', 'trusted-farmer']);
  // Also exercise the real default middleware's missing-token path.
  const real = express(); registerFarmerSummaryRoutes(real, service);
  const realServer = real.listen(0, '127.0.0.1'); await new Promise<void>(resolve => realServer.once('listening', resolve));
  t.after(() => new Promise<void>(resolve => realServer.close(() => resolve())));
  assert.equal((await fetch('http://127.0.0.1:' + (realServer.address() as AddressInfo).port + '/api/farmer/home-summary')).status, 401);
});
