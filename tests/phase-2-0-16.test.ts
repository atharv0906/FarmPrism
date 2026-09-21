import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JsxEmit, ModuleKind, transpileModule } from 'typescript';
import * as listingState from '../src/services/api/listingState';
import { validListing } from '../src/services/api/trading.validation';
import { ApiError } from '../src/services/api/api.client';
const require = createRequire(import.meta.url);
function load(file: string, deps: Record<string, any>) {
  const exports: Record<string, any> = {};
  const code = transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'exports', '__DEV__', code)((id: string) => id === 'react/jsx-runtime' ? require(id) : id.endsWith('/listingState') ? listingState : deps[id] ?? {}, exports, true);
  return exports;
}
const nodes = (v: any): any[] => Array.isArray(v) ? v.flatMap(nodes) : v?.props ? [v, ...nodes(v.props.children)] : [];
const button = (v: any, title: string) => nodes(v).find(n => n.props.title === title);
const text = (v: any): string => Array.isArray(v) ? v.map(text).join(' ') : v?.props ? text(v.props.children) : typeof v === 'string' || typeof v === 'number' ? String(v) : '';
const tick = () => new Promise(resolve => setImmediate(resolve));
const future = '2099-01-01T00:00:00Z', past = '2000-01-01T00:00:00Z';

test('mobile Pickup client uses only the two OTP endpoints and preserves Delivery OTP', async () => {
  const calls: unknown[] = [];
  const { marketplaceMutations: client } = load('src/services/api/mutation.client.ts', { './api.client': { apiClient: { post: async (...args: unknown[]) => { calls.push(args); return {}; } } } });
  const options = { bearerToken: 'mock-session' };
  await client.generatePickupOtp('order', options);
  await client.verifyPickupOtp('order', { otp: '123456' }, options);
  assert.deepEqual(calls, [
    ['/api/farmer/orders/order/pickup-otp', {}, options],
    ['/api/logistics/orders/order/verify-pickup', { otp: '123456' }, options],
  ]);
  assert.equal(client.confirmPickup, undefined, 'retired method cannot bypass OTP');
  assert.equal(typeof client.generateDeliveryOtp, 'function');
  assert.equal(typeof client.verifyDeliveryOtp, 'function');
});
function workspace(role = 'farmer'): any {
  const batch = { id: 'batch', farmerId: 'farmer', code: 'B', crop: 'Onion', quantityKg: 450, grade: null, status: 'available' };
  return { me: { id: role, role }, profiles: [], batches: [batch], offers: [], items: [],
    orders: [{ id: 'order', code: 'FP', farmerId: 'farmer', buyerId: 'buyer', batch, quantityKg: 200, status: 'logistics_advance_paid', pricePerKg: 25, total: 5000 }],
    jobs: [{ id: 'job', orderId: 'order', logisticsId: 'logistics', status: 'advance_paid', feeStatus: 'paid', orderCode: 'FP', crop: 'Onion', quantityKg: 200 }],
    events: [], payments: [], tracking: [], notifications: [] };
}
function harness(data = workspace()) {
  const states: any[] = [], refs: any[] = [], effects: any[] = [], calls: any[] = [];
  let cursor = 0, refCursor = 0, effectCursor = 0, queued: (() => void)[] = [];
  const react = {
    useState(initial: any) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], (v: any) => { states[i] = v; }]; },
    useRef(initial: any) { const i = refCursor++; return refs[i] ?? (refs[i] = { current: initial }); },
    useEffect(fn: () => void, deps: any[]) { const i = effectCursor++; if (!effects[i] || deps.some((v, j) => v !== effects[i][j])) queued.push(fn); effects[i] = deps; },
  };
  const native = { Text: 'Text', View: 'View', Image: 'Image', Pressable: 'Pressable', ScrollView: 'ScrollView', Alert: {} };
  const ui = { ...Object.fromEntries(['Page','FarmerPage','Card','Button','Field','Badge','SelectChip','Metric','SectionTitle','PrimaryAction','ActionTile'].map(n => [n, n])), ui: {}, money: String, date: String, quintals: String, cropArtwork: () => 1, sellAssets: {} };
  const mutations: Record<string, (...args: any[]) => Promise<any>> = {
    generatePickupOtp: async (...args) => { calls.push(['generate', ...args]); return { data: { orderId: 'order', otp: '123456', expiresAt: future } }; },
    verifyPickupOtp: async (...args) => { calls.push(['verify', ...args]); data.orders[0].status = data.jobs[0].status = 'pickup_confirmed'; return { data: { verified: true } }; },
  };
  const refresh = async () => { calls.push(['refresh']); };
  const { useTradingAction } = load('src/hooks/useTradingAction.ts', { react, 'react-native': native, '../services/api/api.client': { ApiError } });
  const deps = {
    react, 'react-native': native,
    '../../hooks/useTrading': { useTrading: () => ({ data, refresh }) },
    '../../hooks/useTradingAction': { useTradingAction },
    '../../hooks/useAuth': { useAuth: () => ({ demoApiToken: 'mock-session' }) },
    '../../services/api/mutation.client': { marketplaceMutations: mutations },
    '../../services/api/api.client': { ApiError },
    '../../services/api/trading.validation': { validListing },
    '../../services/api/trading.client': { tradingClient: { markRead: async (id: string) => calls.push(['read', id]) } },
    '../../components/farmer-dashboard/dashboardAssets': { dashboardAssets: {} },
    '../../components/farmprism-shell/RoleUI': ui, '../../components/farmer-sell/FarmerSellUI': ui,
    './SharedScreens': { ProfileCard: 'ProfileCard' },
  };
  const shared = load('src/screens/trading/SharedScreens.tsx', deps), buyer = load('src/screens/trading/BuyerLogisticsScreens.tsx', deps), farmer = load('src/screens/trading/FarmerSellScreens.tsx', deps);
  const navigation = { navigate: (...args: any[]) => calls.push(['navigate', ...args]) };
  return { data, calls, mutations, render(name: string, params: any = { orderId: 'order', jobId: 'job' }) {
    cursor = refCursor = effectCursor = 0; queued = [];
    const tree = (shared[name] ?? buyer[name] ?? farmer[name])({ route: { name, params }, navigation });
    for (const effect of queued) effect();
    return tree;
  }, profile: shared.ProfileCard };
}

test('selling and shared order text hides internal batch codes while preserving crop and order references', () => {
  // Expand local cards and inspect only displayed text/labels, not internal data props or keys.
  const visible = (v: any): string => Array.isArray(v) ? v.map(visible).join(' ') : v?.props
    ? typeof v.type === 'function' ? visible(v.type(v.props))
      : [v.props.title, v.props.label, v.props.accessibilityLabel, visible(v.props.children)].filter(Boolean).join(' ')
    : typeof v === 'string' || typeof v === 'number' ? String(v) : '';
  for (const role of ['farmer', 'buyer', 'logistics']) {
    const data = workspace(role);
    data.batches[0].code = 'FPB-32994472AD06422FA45D782389B5DA83';
    data.orders[0].code = 'FP-ORDER-123';
    const h = harness(data);
    const rendered = visible(h.render('OrderScreen'));
    assert.doesNotMatch(rendered, /FPB-/);
    assert.match(rendered, /Onion/);
    assert.match(rendered, /FP-ORDER-123/);
  }
  for (const kind of ['auction', 'fixed']) {
    const data = workspace();
    data.batches[0].code = 'FPB-32994472AD06422FA45D782389B5DA83';
    const h = harness(data);
    for (const name of ['SelectBatchScreen', 'QualityScreen', 'CreateListingScreen']) {
      const rendered = visible(h.render(name, { batchId: 'batch', kind }));
      assert.doesNotMatch(rendered, /FPB-/, name);
      assert.match(rendered, /Onion/, name);
    }
    data.items = [{ id: 'listing', batch: data.batches[0], kind, status: kind === 'auction' ? 'open' : 'active', endsAt: future, remainingKg: 100, pricePerKg: 25 }];
    for (const name of ['SellHomeScreen', 'ItemScreen']) {
      const rendered = visible(h.render(name, { itemId: 'listing' }));
      assert.doesNotMatch(rendered, /FPB-/, name);
      assert.match(rendered, /Onion/, name);
      assert.match(rendered, kind === 'auction' ? /AUCTION/ : /FIXED PRICE/, name);
    }
  }
});

test('Farmer pickup generation, selectable expiry and regeneration stay in component memory and hide after pickup', async () => {
  const h = harness(), original = JSON.stringify(h.data.batches);
  button(h.render('OrderScreen'), 'Generate Pickup OTP').props.onPress(); await tick();
  let tree = h.render('OrderScreen');
  assert.match(text(tree), /Pickup OTP:.*123456.*Expires:.*2099/s);
  assert.ok(nodes(tree).some(n => n.props.selectable && text(n).includes('assigned logistics partner')));
  button(tree, 'Regenerate Pickup OTP').props.onPress(); await tick();
  assert.equal(h.calls.filter(c => c[0] === 'generate').length, 2);
  assert.equal(h.calls.filter(c => c[0] === 'refresh').length, 2);
  assert.equal(JSON.stringify(h.data.batches), original);
  h.data.orders[0].status = h.data.jobs[0].status = 'pickup_confirmed';
  tree = h.render('OrderScreen');
  assert.equal(button(tree, 'Generate Pickup OTP'), undefined);
  assert.equal(button(tree, 'Regenerate Pickup OTP'), undefined);
  assert.doesNotMatch(text(tree), /123456/);
  assert.ok(button(harness().render('OrderScreen'), 'Generate Pickup OTP'), 'remount has no saved OTP');
});

test('pickup controls require the correct participant and both pending states', () => {
  for (const role of ['farmer', 'buyer', 'logistics']) for (const orderStatus of ['logistics_advance_paid', 'farmer_advance_pending', 'pickup_confirmed']) for (const jobStatus of ['advance_paid', 'fee_accepted', 'pickup_confirmed']) {
    const d = workspace(role); d.orders[0].status = orderStatus; d.jobs[0].status = jobStatus;
    const correctState = orderStatus === 'logistics_advance_paid' && jobStatus === 'advance_paid';
    assert.equal(!!button(harness(d).render('OrderScreen'), 'Generate Pickup OTP'), role === 'farmer' && correctState);
    const job = harness(d).render('JobScreen');
    assert.equal(!!button(job, 'Verify Pickup OTP'), role === 'logistics' && correctState);
    assert.equal(button(job, 'Confirm Pickup'), undefined);
  }
  const d = workspace(); d.orders[0].farmerId = 'another-farmer';
  assert.equal(button(harness(d).render('OrderScreen'), 'Generate Pickup OTP'), undefined);
  d.jobs[0].logisticsId = null;
  assert.equal(button(harness(d).render('OrderScreen'), 'Generate Pickup OTP'), undefined);
});

test('Logistics sanitizes six digits, verifies once, refreshes, clears input and enables tracking without changing remainder', async () => {
  const h = harness(workspace('logistics')), original = JSON.stringify(h.data.batches);
  let tree = h.render('JobScreen');
  assert.equal(button(tree, 'Verify Pickup OTP').props.disabled, true);
  const field = nodes(tree).find(n => n.props.label === 'Farmer Pickup OTP (6 digits)');
  assert.equal(field.props.secure, true);
  field.props.onChange('a12-34567');
  tree = h.render('JobScreen');
  assert.equal(nodes(tree).find(n => n.props.label === 'Farmer Pickup OTP (6 digits)').props.value, '123456');
  assert.equal(button(tree, 'Verify Pickup OTP').props.disabled, false);
  button(tree, 'Verify Pickup OTP').props.onPress(); await tick();
  tree = h.render('JobScreen');
  assert.deepEqual(h.calls.map(c => c[0]), ['verify', 'refresh']);
  assert.deepEqual(h.calls[0].slice(1), ['order', { otp: '123456' }, { bearerToken: 'mock-session' }]);
  assert.match(text(tree), /Pickup confirmed. Tracking is now available/);
  assert.ok(button(tree, 'Send actual device location'));
  assert.equal(button(tree, 'Verify Pickup OTP'), undefined);
  assert.equal(JSON.stringify(h.data.batches), original);
  h.data.jobs[0].status = 'advance_paid'; h.data.orders[0].status = 'logistics_advance_paid';
  assert.equal(nodes(h.render('JobScreen')).find(n => n.props.label === 'Farmer Pickup OTP (6 digits)').props.value, '');
});

test('Pickup wrong code and fifth attempt show safe remaining-attempt and regeneration guidance', async () => {
  for (const remaining of [4, 0]) {
    const h = harness(workspace('logistics'));
    h.mutations.verifyPickupOtp = async () => { throw new ApiError(remaining ? 400 : 409, remaining ? 'INVALID_OTP' : 'OTP_ATTEMPTS_EXCEEDED', 'Invalid OTP', { attemptsRemaining: remaining }); };
    nodes(h.render('JobScreen')).find(n => n.props.label === 'Farmer Pickup OTP (6 digits)').props.onChange('123456');
    button(h.render('JobScreen'), 'Verify Pickup OTP').props.onPress(); await tick();
    assert.match(text(h.render('JobScreen')), remaining ? /4 attempts remaining/ : /Ask the Farmer to generate a new Pickup OTP/);
    assert.equal(h.data.jobs[0].status, 'advance_paid');
  }
});

test('expired auctions and partial bids leave active views, hide actions and release the available source remainder', () => {
  for (const status of ['open', 'partially_sold', 'expired']) {
    const d = workspace(); d.items = [{ id: 'auction', kind: 'auction', status, endsAt: past, batch: d.batches[0], remainingKg: 150 }];
    d.offers = [{ id: 'offer', itemId: 'auction', kind: 'auction', status: 'partially_accepted', remainingKg: 55, createdAt: past }];
    const h = harness(d);
    assert.equal(listingState.listingActive(d.items[0]), false);
    assert.equal(button(h.render('OfferScreen', { offerId: 'offer' }), 'Accept Offer'), undefined);
    assert.equal(button(h.render('OfferScreen', { offerId: 'offer' }), 'Reject Offer'), undefined);
    assert.ok(button(h.render('SelectBatchScreen', {}), 'Select Batch'));
    assert.equal(button(h.render('SellHomeScreen'), 'View Details'), undefined);
    const buyer = harness(d);
    let tree = buyer.render('MyBidsScreen');
    assert.equal(button(tree, 'View Listing'), undefined);
    nodes(tree).find(n => n.props.label === 'History').props.onPress();
    tree = buyer.render('MyBidsScreen');
    assert.ok(button(tree, 'View Listing')); assert.match(text(tree), /expired/);
    assert.equal(button(tree, 'Revise Bid'), undefined); assert.equal(button(tree, 'Withdraw'), undefined);
    assert.equal(d.orders[0].quantityKg, 200);
    assert.equal(d.batches[0].quantityKg, 450);
  }
});

test('real replaced/outbid/expired bid statuses navigate from History; accepted/rejected/withdrawn keep their tabs', () => {
  for (const [status, tab] of [['replaced','History'], ['outbid','History'], ['expired','History'], ['accepted','Accepted'], ['rejected','Rejected'], ['withdrawn','Withdrawn']]) {
    const d = workspace('buyer'); d.offers = [{ id: status, itemId: 'auction', kind: 'auction', status, createdAt: past }];
    const h = harness(d);
    nodes(h.render('MyBidsScreen')).find(n => n.props.label === tab).props.onPress();
    assert.ok(button(h.render('MyBidsScreen'), 'View Listing'), status);
  }
});

test('auction warning and expiry notifications mark read and open the auction', async () => {
  for (const type of ['auction_expiring', 'auction_expired']) {
    const d = workspace(); d.notifications = [{ id: type, type, title: type, body: 'Review this auction', entityType: 'auction', entityKey: 'auction', createdAt: past }];
    const h = harness(d);
    nodes(h.render('TradingNotificationsScreen')).find(n => n.props.accessibilityLabel === type).props.onPress(); await tick();
    assert.deepEqual(h.calls, [['read', type], ['refresh'], ['navigate', 'Item', { itemId: 'auction' }]]);
  }
});

test('route resource disappearance offers a recovery action', () => {
  for (const [screen, params] of [['OfferScreen',{offerId:'missing'}], ['CreateListingScreen',{batchId:'missing',kind:'auction'}], ['QualityScreen',{batchId:'missing'}], ['ItemScreen',{itemId:'missing'}], ['BidFormScreen',{itemId:'missing'}], ['OrderScreen',{orderId:'missing'}], ['JobScreen',{jobId:'missing'}]] as const) {
    const tree = harness().render(screen, params);
    assert.match(text(tree), /unavailable|no longer available/i, screen);
    assert.ok(nodes(tree).some(n => n.type === 'Button' && n.props.onPress), screen);
  }
});

test('Farmer trust remains nullable and backend supplied regardless of an unlisted grade-null or Grade C batch', () => {
  for (const grade of [null, 'A', 'B', 'C']) for (const score of [null, 100]) {
    const d = workspace(); d.batches[0].grade = grade;
    const h = harness(d), tree = h.profile({ profile: { role: 'farmer', name: 'Farmer', trustScore: score, qualityConsistency: score } });
    assert.ok(nodes(tree).some(n => n.props.label === 'Trust Score' && n.props.value === (score === null ? 'Not available' : '100/100')));
    assert.match(text(tree), /Quality declaration consistency/);
    assert.match(text(tree), score === null ? /Not available/ : /100/);
  }
});

test('optional onboarding area accepts blank/positive decimals and rejects malformed syntax', () => {
  for (const farmSize of ['', '1', '1.5', '12.25', '1..2', '.', '1.', '..2', 'NaN', '0', '-1']) {
    const calls: any[] = [];
    const mod = load('src/screens/FarmerScreens.tsx', {
      react: { createContext: () => ({}), useContext: () => ({ draft: { state: 'Maharashtra', district: 'Pune', taluka: 'Haveli', village: 'Wagholi', crops: ['Onion'], farmSize }, update() {} }), useState: (v: unknown) => [v, () => {}], useMemo: (fn: () => unknown) => fn() },
      'react-native': { Text: 'Text', View: 'View', Platform: { select: () => 'serif' }, StyleSheet: { create: (s: unknown) => s } },
    });
    const tree = mod.FarmerDetailsScreen({ navigation: { navigate: (...args: any[]) => calls.push(args) } });
    nodes(tree).find(n => n.props.onPress && /next|review|continue/i.test(n.props.label ?? '')).props.onPress();
    assert.equal(calls.length, ['', '1', '1.5', '12.25'].includes(farmSize) ? 1 : 0, farmSize);
  }
});
