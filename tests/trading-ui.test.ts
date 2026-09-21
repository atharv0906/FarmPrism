import * as listingState from '../src/services/api/listingState';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JsxEmit, ModuleKind, transpileModule } from 'typescript';
import { validListing, validAdvance } from '../src/services/api/trading.validation';
const require = createRequire(import.meta.url);
type Element = { type: unknown; props: Record<string, any> };
function nodes(value: any): Element[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== 'object' || !value.props) return [];
  return [value, ...nodes(value.props.children)];
}
function load(file: string, dependencies: Record<string, unknown>) {
  const exports: Record<string, (...args: any[]) => any> = {};
  const code = transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'exports', '__DEV__', code)((id: string) => id === 'react/jsx-runtime' ? require(id) : (id.endsWith('/listingState') ? listingState : dependencies[id] ?? {}), exports, true);
  return exports;
}
const primitives = Object.fromEntries(['FarmerPage', 'Card', 'ActionTile', 'SectionTitle', 'Field', 'Button'].map(name => [name, name]));

function partialScreens(data: any, initial: unknown[] = []) {
  const values = [...initial], calls: Array<{ name: string; args: any[] }> = [];
  let index = 0;
  const mutations = Object.fromEntries(['createAuction', 'createFixedListing', 'placeOrReviseBid', 'createPurchaseRequest', 'acceptBid', 'acceptPurchaseRequest'].map(name => [name, (...args: any[]) => { calls.push({ name, args }); return Promise.resolve({ data: {} }); }]));
  const deps = {
    react: { useState: (value: unknown) => { const i = index++; if (!(i in values)) values[i] = value; return [values[i], (next: unknown) => { values[i] = next; }]; }, useEffect() {} },
    'react-native': { Text: 'Text', View: 'View', Image: 'Image', Switch: 'Switch' },
    '../../services/api/trading.validation': { validListing, validAdvance },
    '../../services/api/mutation.client': { marketplaceMutations: mutations },
    '../../hooks/useTrading': { useTrading: () => ({ data, refresh() {} }) },
    '../../hooks/useTradingAction': { useTradingAction: () => ({ pending: false, run: (fn: () => unknown) => fn() }) },
    '../../hooks/useAuth': { useAuth: () => ({ demoApiToken: 'in-memory-test' }) },
    '../../components/farmer-sell/FarmerSellUI': { ...primitives, ui: {}, sellAssets: {}, quintals: String, cropArtwork: () => null },
    '../../components/farmprism-shell/RoleUI': { ...primitives, Page: 'Page', Badge: 'Badge', ui: {}, money: String, date: String },
    './SharedScreens': { ProfileCard: 'ProfileCard' },
  };
  const farmer = load('src/screens/trading/FarmerSellScreens.tsx', deps);
  const buyer = load('src/screens/trading/BuyerLogisticsScreens.tsx', deps);
  return { calls, render(name: string, params: any) { index = 0; return nodes((farmer[name] ?? buyer[name])({ route: { params }, navigation: {} })); } };
}

test('Auction creation defaults ON, toggles OFF before publishing and excludes Fixed Price', () => {
  for (const kind of ['auction', 'fixed']) {
    const h = partialScreens({ batches: [{ id: 'b', quantityKg: 10, crop: 'Tomato' }] }, ['10', '20']);
    let tree = h.render('CreateListingScreen', { batchId: 'b', kind });
    const toggle = tree.find(n => n.type === 'Switch');
    if (kind === 'auction') {
      assert.equal(toggle?.props.value, true);
      tree.find(n => n.props.title === 'Publish Auction')!.props.onPress();
      assert.equal(h.calls[0].args[0].allowPartialSale, true);
      toggle!.props.onValueChange(false);
      tree = h.render('CreateListingScreen', { batchId: 'b', kind });
      assert.ok(tree.some(n => n.props.children === 'Buyers must bid for the full auction quantity.'));
      tree.find(n => n.props.title === 'Publish Auction')!.props.onPress();
      assert.equal(h.calls[1].args[0].allowPartialSale, false);
    } else {
      assert.equal(toggle, undefined);
      tree.find(n => n.props.title === 'Publish Fixed Price')!.props.onPress();
      assert.equal('allowPartialSale' in h.calls[0].args[0], false);
    }
  }
});

test('Buyer full-lot quantity stays visible, ignores edits, follows refreshed data and submits full bids/revisions', () => {
  for (const [kind, allowPartialSale] of [['auction', false], ['auction', true], ['fixed', undefined]] as const) {
    const item = { id: 'a', kind, allowPartialSale, status: kind === 'auction' ? 'open' : 'active', remainingKg: 10, pricePerKg: 20, endsAt: '2099-01-01', batch: { crop: 'Tomato' } };
    const h = partialScreens({ items: [item] }, ['4', '25', '30', 'Warehouse', '18', '73']);
    let tree = h.render('BidFormScreen', { itemId: 'a' });
    const field = tree.find(n => n.props.label === 'Quantity (KG)')!;
    const locked = kind === 'auction' && allowPartialSale === false;
    assert.equal(field.props.editable, !locked);
    assert.equal(field.props.value, locked ? '10' : '4');
    field.props.onChange('5');
    tree = h.render('BidFormScreen', { itemId: 'a' });
    assert.equal(tree.find(n => n.props.label === 'Quantity (KG)')!.props.value, locked ? '10' : '5');
    tree.find(n => n.props.title === 'Submit')!.props.onPress();
    assert.equal(h.calls[0].args[1].quantityKg, locked ? 10 : 5);
    if (locked) {
      item.remainingKg = 8;
      tree = h.render('BidFormScreen', { itemId: 'a' });
      assert.equal(tree.find(n => n.props.label === 'Quantity (KG)')!.props.value, '8');
      tree.find(n => n.props.title === 'Submit')!.props.onPress();
      assert.equal(h.calls[1].args[1].quantityKg, 8);
      item.status = 'completed';
      tree = h.render('BidFormScreen', { itemId: 'a' });
      assert.equal(tree.find(n => n.props.title === 'Submit')!.props.disabled, true);
    }
  }
});

test('Farmer OFF acceptance has one full-lot action; ON and Fixed Price retain partial acceptance', () => {
  for (const [kind, allowPartialSale] of [['auction', false], ['auction', true], ['fixed', undefined]] as const) {
    const item = { id: 'a', kind, allowPartialSale, remainingKg: 10, endsAt: '2099-01-01', status: kind === 'auction' ? 'open' : 'active', batch: { quantityKg: 20 } };
    const offer = { id: 'bid', itemId: 'a', kind, remainingKg: 10, status: kind === 'auction' ? 'active' : 'pending' };
    const h = partialScreens({ items: [item], offers: [offer], profiles: [] }, ['2']);
    const tree = h.render('OfferScreen', { offerId: 'bid' });
    const full = kind === 'auction' && allowPartialSale === false;
    assert.equal(tree.some(n => n.props.label?.startsWith('Accept quantity')), !full);
    const button = tree.find(n => n.props.title === (full ? 'Accept Full Bid — 10 KG' : 'Accept Offer'))!;
    assert.equal(button.props.disabled, false);
    button.props.onPress();
    assert.equal(h.calls[0].args[1].quantityKg, full ? 10 : 2);
    assert.equal(tree.some(n => n.type === 'Switch'), false);
  }
});

test('shared Field disables native editing and drops the change handler when read-only', () => {
  const { Field } = load('src/components/farmer-sell/FarmerSellUI.tsx', {
    'react-native': { Text: 'Text', View: 'View', TextInput: 'TextInput', Platform: { select: () => 'serif' }, StyleSheet: { create: (s: unknown) => s } },
  });
  const onChange = () => {};
  for (const editable of [false, true]) {
    const input = nodes(Field({ label: 'Quantity (KG)', value: '10', onChange, editable })).find(n => n.type === 'TextInput')!;
    assert.equal(input.props.editable, editable);
    assert.equal(input.props.onChangeText, editable ? onChange : undefined);
    assert.equal(input.props.accessibilityState.disabled, !editable);
  }
});

test('clean Buyer and Logistics screens display honest empty states and nullable Trust', () => {
  const data = { me: { id: 'account', role: 'buyer', name: 'Buyer', trustScore: null, completedTransactions: null }, items: [], offers: [], orders: [], jobs: [], profiles: [] };
  const deps = {
    react: { useState: (initial: unknown) => [initial, () => {}] },
    'react-native': { Text: 'Text', View: 'View', ScrollView: 'ScrollView' },
    '../../components/farmer-dashboard/dashboardAssets': { dashboardAssets: {} },
    '../../components/farmprism-shell/RoleUI': { ...primitives, Page: 'Page', Metric: 'Metric', Badge: 'Badge', SelectChip: 'SelectChip', ui: {} },
    '../../hooks/useTrading': { useTrading: () => ({ data, loading: false, refresh() {} }) },
    '../../hooks/useTradingAction': { useTradingAction: () => ({ pending: false }) },
    '../../hooks/useAuth': { useAuth: () => ({ demoApiToken: null }) },
  };
  const buyer = load('src/screens/trading/BuyerLogisticsScreens.tsx', deps);
  assert.ok(nodes(buyer.BuyerHomeScreen({ navigation: {}, route: { name: 'BuyerMarket' } })).some(n => n.props.title === 'No listings right now'));
  assert.ok(nodes(buyer.MyBidsScreen({ navigation: {} })).some(n => n.props.title === 'No active bids or requests'));
  for (const name of ['Jobs', 'History', 'Active', 'LogisticsHome']) assert.ok(nodes(buyer.JobsScreen({ navigation: {}, route: { name } })).some(n => typeof n.props.children === 'string' && n.props.children.startsWith('No jobs in this view')));
  const shared = load('src/screens/trading/SharedScreens.tsx', deps);
  assert.ok(nodes(shared.OrdersScreen({ navigation: {}, route: { name: 'Orders' } })).some(n => n.props.children === 'No orders in this view yet.'));
  for (const role of ['farmer', 'buyer', 'logistics']) assert.ok(nodes(shared.ProfileCard({ profile: { ...data.me, role } })).some(n => n.props.label === 'Trust Score' && n.props.value === 'Not available'));
});
function screens(stateValues: unknown[] = []) {
  const setters: Record<number, unknown> = {};
  let index = 0;
  const data = { batches: [{ id: 'batch', quantityKg: 100, crop: 'Tomato', code: 'B', grade: 'A' }] };
  const module = load('src/screens/trading/FarmerSellScreens.tsx', {
    react: { useState: (initial: unknown) => { const i = index++; return [stateValues[i] ?? initial, (value: unknown) => { setters[i] = value; }]; } },
    'react-native': { Text: 'Text', View: 'View' },
    '../../services/api/trading.validation': { validListing },
    '../../hooks/useTrading': { useTrading: () => ({ data, loading: false, error: null, refresh() {} }) },
    '../../hooks/useTradingAction': { useTradingAction: () => ({ pending: false }) },
    '../../hooks/useAuth': { useAuth: () => ({ demoApiToken: 'test-memory-token' }) },
    '../../components/farmer-sell/FarmerSellUI': { ...primitives, sellAssets: {}, ui: {}, quintals: String, cropArtwork: () => null },
    '../../components/farmprism-shell/RoleUI': { SelectChip: 'SelectChip' },
  });
  return module;
}
test('whole selling-method cards navigate with the batch and distinct listing kinds', () => {
  const calls: unknown[] = [];
  const screen = screens().ChooseMethodScreen({ route: { params: { batchId: 'batch', suggestedPrice: 24 } }, navigation: { navigate: (...args: unknown[]) => calls.push(args) } });
  const cards = nodes(screen).filter(n => n.type === 'ActionTile');
  assert.equal(cards.length, 2);
  assert.equal(nodes(screen).filter(n => n.type === 'Button').length, 0, 'no competing nested button');
  for (const card of cards) card.props.onPress();
  assert.deepEqual(calls, [
    ['CreateListing', { batchId: 'batch', suggestedPrice: 24, kind: 'auction' }],
    ['CreateListing', { batchId: 'batch', suggestedPrice: 24, kind: 'fixed' }],
  ]);
});

test('Select Batch preserves eligibility and canonical Quality navigation with optional crop filter', () => {
  const batch = (id: string, crop = 'Tomato', status = 'available', quantityKg = 100) => ({ id, crop, status, quantityKg, grade: null, code: id });
  const data = { batches: [batch('tomato'), batch('onion', 'Onion'), batch('reserved', 'Tomato', 'reserved'), batch('zero', 'Tomato', 'available', 0), batch('listed')], items: [{ status: 'open', endsAt: '2099-01-01T00:00:00Z', batch: { id: 'listed' } }] };
  const mod = load('src/screens/trading/FarmerSellScreens.tsx', {
    'react-native': { Text: 'Text', View: 'View', Image: 'Image' },
    '../../hooks/useTrading': { useTrading: () => ({ data, loading: false, refresh() {} }) },
    '../../components/farmer-sell/FarmerSellUI': { ...primitives, ui: {}, quintals: String, cropArtwork: () => null },
  });
  for (const crop of [undefined, 'Tomato', 'Potato']) {
    const calls: unknown[] = [];
    const screen = mod.SelectBatchScreen({ route: { params: crop ? { crop } : undefined }, navigation: { navigate: (...args: unknown[]) => calls.push(args) } });
    const buttons = nodes(screen).filter(n => n.type === 'Button' && n.props.title !== 'Open My Farm');
    assert.equal(buttons.length, crop === 'Potato' ? 0 : crop ? 1 : 2);
    for (const button of buttons) button.props.onPress();
    assert.deepEqual(calls, (crop === 'Potato' ? [] : crop ? ['tomato'] : ['tomato', 'onion']).map(batchId => ['Quality', { batchId }]));
  }
});
test('listing forms default to 24 hours and gate publication on valid input', () => {
  for (const kind of ['auction', 'fixed']) {
    for (const [quantity, price, enabled] of [['', '', false], ['101', '24', false], ['10', '24', true]] as const) {
      const screen = screens([quantity, price]).CreateListingScreen({ route: { params: { batchId: 'batch', kind } }, navigation: {} });
      const elements = nodes(screen);
      const publish = elements.find(n => n.type === 'Button' && n.props.title.startsWith('Publish'))!;
      assert.equal(publish.props.disabled, !enabled);
      const durations = elements.filter(n => typeof n.type === 'function').map(n => (n.type as Function)(n.props)).filter(n => n.type === 'SelectChip');
      assert.equal(durations.length, kind === 'auction' ? 3 : 0);
      if (kind === 'auction') assert.deepEqual(durations.map(n => n.props.selected), [false, false, true]);
    }
  }
});
test('cached refresh errors are compact; initial errors and mutation failures remain distinct', () => {
  const { LoadState } = load('src/components/farmprism-shell/LoadState.tsx', { 'react-native': { View: 'View', Text: 'Text', Pressable: 'Pressable', ActivityIndicator: 'ActivityIndicator', StyleSheet: { create: (s: unknown) => s } } });
  const cached = nodes(LoadState({ hasData: true, error: 'Service unavailable', loading: true, retry() {} }));
  assert.ok(cached.some(n => n.props.children === "Couldn't refresh. Showing last updated data."));
  assert.equal(cached.some(n => n.type === 'ActivityIndicator'), false);
  const initial = nodes(LoadState({ hasData: false, error: 'Service unavailable', retry() {} }));
  assert.ok(initial.some(n => n.props.children === 'Service unavailable'));
  const mutation = nodes(LoadState({ hasData: true, mutationError: 'This listing has closed.' }));
  assert.ok(mutation.some(n => n.props.children === 'This listing has closed.'));
  assert.equal(mutation.some(n => n.type === 'Pressable'), false, 'mutation failures do not show a workspace Retry');
});

test('logistics controls follow the job stage and simulated coordinates start collapsed', () => {
  for (const [status, orderStatus, expected, absent] of [
    ['available', 'logistics_pending', 'Claim Job', 'Propose Logistics Fee'],
    ['claimed', 'logistics_pending', 'Propose Logistics Fee', 'Confirm Pickup'],
    ['advance_paid', 'logistics_advance_paid', 'Verify Pickup OTP', 'Verify Delivery OTP'],
    ['in_transit', 'delivery_otp_pending', 'Verify Delivery OTP', 'Claim Job'],
    ['completed', 'completed', 'View Order / Feedback', 'Verify Delivery OTP'],
  ]) {
    const data = { me: { id: 'driver' }, profiles: [], jobs: [{ id: 'job', orderId: 'order', orderCode: 'FP-1', crop: 'Onion', quantityKg: 100, status, fee: null, feeStatus: 'awaiting_proposal', logisticsId: status === 'available' ? null : 'driver' }], orders: [{ id: 'order', status: orderStatus }] };
    const { JobScreen } = load('src/screens/trading/BuyerLogisticsScreens.tsx', {
      react: { useState: (v: unknown) => [v, () => {}], useEffect() {} },
      'react-native': { Text: 'Text', View: 'View' },
      '../../hooks/useTrading': { useTrading: () => ({ data, refresh() {} }) },
      '../../hooks/useTradingAction': { useTradingAction: () => ({ pending: false }) },
      '../../hooks/useAuth': { useAuth: () => ({ demoApiToken: 'test-memory-token' }) },
      '../../components/farmprism-shell/RoleUI': { ...primitives, Page: 'Page', Badge: 'Badge', ui: {}, money: String },
      './SharedScreens': { ProfileCard: 'ProfileCard' },
    });
    const elements = nodes(JobScreen({ route: { params: { jobId: 'job' } }, navigation: {} }));
    const buttons = elements.filter(n => n.type === 'Button').map(n => n.props.title);
    assert.ok(buttons.includes(expected), status);
    assert.equal(buttons.includes(absent), false, status);
    assert.equal(elements.some(n => n.props.label === 'Simulated latitude'), false);
  }
});
