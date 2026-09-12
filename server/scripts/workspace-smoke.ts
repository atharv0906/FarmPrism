import { workspaceContractError } from '../../src/services/api/workspace.contract';

// Explicit live check: sessions remain in memory, and only aggregate results print.
const base = process.env.SMOKE_API_URL ?? 'http://localhost:3000';
for (const [role, phone] of [['farmer', '+919000000001'], ['buyer', '+919000000011'], ['logistics', '+919000000021']]) {
  const session = await fetch(base + '/api/demo/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp: '123456' }) });
  const auth = await session.json();
  if (!session.ok || typeof auth.data?.token !== 'string') throw new Error(role + ' session failed');
  const headers = { Authorization: 'Bearer ' + auth.data.token };
  try {
    const response = await fetch(base + '/api/workspace', { headers });
    const body = await response.json();
    const error = response.ok ? workspaceContractError(body.data) : 'HTTP ' + response.status;
    console.log(role + ' /api/workspace: ' + (error ?? (body.data.me.role === role ? 'PASS' : 'ROLE MISMATCH')));
    if (error || body.data.me.role !== role) process.exitCode = 1;
    if (role === 'farmer') {
      const market = await fetch(base + '/api/market/Tomato/current', { headers });
      const result = await market.json();
      console.log('Tomato market: ' + (market.ok ? (result.data.isDemo ? 'Demo market data' : 'AGMARKNET') + ', normalized INR/KG finite: ' + Number.isFinite(result.data.modalPricePerKg) : 'HTTP ' + market.status));
    }
  } finally { await fetch(base + '/api/demo/logout', { method: 'POST', headers }); }
}
