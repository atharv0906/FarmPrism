import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-service-role-key';
const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
const active = await import('../lib/demoStore.js');
const duplicate = await import('../repositories/demo.repository.js');
const { registerDemoRoutes } = await import('./demo.routes.js');
const { requireDemoSession } = await import('../middleware/auth.js');

test('both session implementations revoke by hash with IS NULL; real logout route rejects reuse', async t => {
  const raw = 'unit-test-memory-token', hashed = createHash('sha256').update(raw).digest('hex');
  let revokedAt: string | null = null;
  const operations: Array<{ method: string; column: string; value: unknown }> = [];
  t.mock.method(supabaseAdmin, 'from', (table: string) => {
    const filters: Record<string, unknown> = {};
    let updates: Record<string, unknown> = {};
    let nullPredicate = false;
    const query = {
      select() { return query; },
      update(values: Record<string, unknown>) { updates = values; return query; },
      eq(column: string, value: unknown) {
        assert.notEqual(value, null, 'SQL null must use IS');
        operations.push({ method: 'eq', column, value }); filters[column] = value; return query;
      },
      is(column: string, value: unknown) {
        operations.push({ method: 'is', column, value });
        assert.equal(column, 'revoked_at'); assert.equal(value, null); nullPredicate = true; return query;
      },
      async maybeSingle() {
        if (table === 'demo_sessions') return { error: null, data: filters.token_hash === hashed ? {
          id: 'session', account_id: 'farmer', token_hash: hashed, expires_at: new Date(Date.now() + 60000).toISOString(), revoked_at: revokedAt,
        } : null };
        if (table === 'demo_accounts') return { error: null, data: { id: 'farmer', role_code: 'farmer', login_label: 'farmer1', phone: '+919000000001', full_name: 'Farmer', is_enabled: true } };
        return { data: null, error: null };
      },
      then(resolve: (value: unknown) => unknown) {
        if ('revoked_at' in updates) {
          assert.equal(table, 'demo_sessions'); assert.equal(filters.token_hash, hashed); assert.equal(nullPredicate, true);
          if (revokedAt === null) revokedAt = String(updates.revoked_at);
        }
        return Promise.resolve({ data: null, error: null }).then(resolve);
      },
    };
    return query;
  });
  for (const [lookup, revoke] of [[active.findActiveSessionByToken, active.revokeDemoSessionByToken], [duplicate.findActiveSessionByToken, duplicate.revokeSessionByToken]]) {
    revokedAt = null;
    assert.ok(await lookup(raw));
    assert.equal(await revoke(raw), true);
    assert.ok(revokedAt);
    assert.equal(await lookup(raw), null);
  }
  revokedAt = null;
  const app = express(); app.use(express.json()); registerDemoRoutes(app);
  app.get('/protected', requireDemoSession, (_req, res) => res.json({ ok: true }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  const headers = { Authorization: 'Bearer ' + raw };
  assert.equal((await fetch(base + '/protected', { headers })).status, 200);
  const logout = await fetch(base + '/api/demo/logout', { method: 'POST', headers });
  assert.equal(logout.status, 200);
  const body = await logout.json(); assert.equal(body.data.ok, true);
  assert.equal(JSON.stringify(body).includes(raw), false); assert.equal(JSON.stringify(body).includes(hashed), false);
  assert.equal((await fetch(base + '/protected', { headers })).status, 401);
  assert.equal((await fetch(base + '/api/demo/logout', { method: 'POST', headers })).status, 401);
  assert.equal(JSON.stringify(operations).includes(raw), false);
  assert.equal(operations.filter(op => op.method === 'is').length, 3);
});
