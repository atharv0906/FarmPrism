import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-only';
const { supabaseAdmin } = await import('../lib/supabaseAdmin.js');
const { registerDemoRoutes } = await import('./demo.routes.js');
test('fixed demo account accepts arbitrary six-digit prototype OTP without SMS or Auth users', async t => {
  const tables: string[] = []; let insertions = 0;
  t.mock.method(supabaseAdmin.auth, 'signInWithOtp', () => assert.fail('No SMS allowed'));
  t.mock.method(supabaseAdmin.auth.admin, 'createUser', () => assert.fail('No Auth user needed'));
  t.mock.method(supabaseAdmin, 'from', (table: string) => {
    tables.push(table); let phone = '', values: Record<string, unknown> = {};
    const q = { select() { return q; }, eq(key: string, value: string) { if (key === 'phone') phone = value; return q; },
      insert(v: Record<string, unknown>) { insertions++; values = v; return q; },
      async maybeSingle() { return { error: null, data: table === 'demo_accounts' ? (phone === '+919000000001' ? { id: 'farmer', full_name: 'Farmer', role_code: 'farmer', phone, login_label: 'farmer1', is_enabled: true } : null) : table === 'demo_sessions' ? { id: 'session', ...values } : null }; } };
    return q;
  });
  const app = express(); app.use(express.json()); registerDemoRoutes(app);
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(r => server.once('listening', r)); t.after(() => server.close());
  const request = (phone: string, otp: string) => fetch('http://127.0.0.1:' + (server.address() as AddressInfo).port + '/api/demo/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp }) });
  for (const otp of ['000000', '128493', '999999']) assert.equal((await request('+919000000001', otp)).status, 200);
  for (const otp of ['12345', '1234567', 'abcdef', '']) assert.equal((await request('+919000000001', otp)).status, 400);
  assert.equal((await request('+919999999999', '123456')).status, 401); assert.equal(insertions, 3);
  assert.ok(tables.every(t => t.startsWith('demo_')));
});
