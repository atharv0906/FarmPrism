import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JsxEmit, ModuleKind, transpileModule } from 'typescript';
import { validListing } from '../src/services/api/trading.validation';
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
  new Function('require', 'exports', '__DEV__', code)((id: string) => id === 'react/jsx-runtime' ? require(id) : dependencies[id] ?? {}, exports, true);
  return exports;
}
const primitives = Object.fromEntries(['FarmerPage', 'Card', 'ActionTile', 'SectionTitle', 'Field', 'Button'].map(name => [name, name]));
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
    ['advance_paid', 'pickup_pending', 'Confirm Pickup', 'Verify Delivery OTP'],
    ['in_transit', 'delivery_otp_pending', 'Verify Delivery OTP', 'Claim Job'],
    ['completed', 'completed', 'View Order / Feedback', 'Verify Delivery OTP'],
  ]) {
    const data = { me: { id: 'driver' }, profiles: [], jobs: [{ id: 'job', orderId: 'order', orderCode: 'FP-1', crop: 'Onion', quantityKg: 100, status, fee: null, feeStatus: 'awaiting_proposal', logisticsId: status === 'available' ? null : 'driver' }], orders: [{ id: 'order', status: orderStatus }] };
    const { JobScreen } = load('src/screens/trading/BuyerLogisticsScreens.tsx', {
      react: { useState: (v: unknown) => [v, () => {}] },
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
