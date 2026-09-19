import * as listingState from '../src/services/api/listingState';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JsxEmit, ModuleKind, transpileModule } from 'typescript';
import * as validation from '../src/services/api/farmerInventory.validation';
import { ApiError } from '../src/services/api/api.client';
const require = createRequire(import.meta.url);
type Element = { type: any; props: Record<string, any> };
function nodes(v: any): Element[] { if (Array.isArray(v)) return v.flatMap(nodes); if (!v?.props) return []; return [v, ...nodes(v.props.children)]; }
const batch = (status = 'available', remainingQuantityKg = 100) => ({ id: status, crop: 'Tomato', batchCode: status, originalQuantityKg: 100, remainingQuantityKg, qualityGrade: null, status, createdAt: '2026-09-15', updatedAt: '2026-09-15', sellable: status === 'available' && remainingQuantityKg > 0 });
const farm = () => ({ farm: { id: 'farmer', location: 'Pune', area: 3, latitude: null, longitude: null }, summary: { cropCount: 1, totalAvailableKg: 100, activeBatchCount: 2 }, crops: [{ id: 'tomato', name: 'Tomato', availableKg: 100, batchCount: 2, status: 'active' }], batches: [batch(), batch('reserved')], activityEvents: [] });
function harness(data = farm(), stateValues: unknown[] = []) {
  const calls: unknown[] = [], states = [...stateValues], refs: any[] = []; let index = 0, refIndex = 0;
  const navigation = { navigate: (...args: unknown[]) => calls.push(args), replace: (...args: unknown[]) => calls.push(args) };
  const mutations = { addCrop: async (...args: unknown[]) => { calls.push(['addCrop', ...args]); }, addProduce: async (...args: unknown[]) => { calls.push(['addProduce', ...args]); }, editFarm: async (...args: unknown[]) => { calls.push(['editFarm', ...args]); } };
  const workspace = { data: { items: [] as any[] }, loading: false, error: null };
  const dependencies: Record<string, unknown> = {
    react: { useState: (initial: unknown) => { const i = index++; if (!(i in states)) states[i] = initial; return [states[i], (v: unknown) => { states[i] = v; }]; }, useRef: (initial: unknown) => { const i = refIndex++; return refs[i] ?? (refs[i] = { current: initial }); }, useEffect() {}, useCallback: (fn: unknown) => fn },
    'react-native': { Text: 'Text', View: 'View', Image: 'Image', Linking: { openURL: async (url: string) => calls.push(['map', url]) } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
    '../hooks/useFarmerMyFarm': { useFarmerMyFarm: () => ({ data, loading: false, error: null, refresh: async () => calls.push(['refresh']) }) },
    '../hooks/useTrading': { useTrading: () => workspace }, '../hooks/useRemote': { useRemote: () => ({ data: null, loading: false }) },
    '../services/api/farmerInventory.client': { farmerInventoryClient: mutations }, '../services/api/api.client': { ApiError },
    '../services/api/farmerInventory.validation': validation,
    '../components/farmer-sell/FarmerSellUI': { ...Object.fromEntries(['FarmerPage', 'Card', 'Button', 'SectionTitle', 'Field', 'Badge'].map(n => [n, n])), ui: {}, cropArtwork: () => 1 },
  };
  const exports: Record<string, (props: any) => Element> = {};
  const code = transpileModule(readFileSync('src/screens/FarmerFarmScreens.tsx', 'utf8'), { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'exports', code)((id: string) => id === 'react/jsx-runtime' ? require(id) : (id.endsWith('/listingState') ? listingState : dependencies[id] ?? {}), exports);
  function render(name: string, params?: unknown) { index = 0; refIndex = 0; let tree = exports[name]({ navigation, route: { params } }); if (name === 'AddCropScreen' || name === 'AddProduceScreen') tree = tree.type(tree.props); return tree; }
  return { render, calls, states, mutations, workspace };
}
const button = (tree: Element, title: string) => nodes(tree).find(n => n.type === 'Button' && n.props.title === title)!;
test('Add Crop submits quantity without grade, refreshes and opens canonical crop details', async () => {
  const d = farm(); d.crops = []; const h = harness(d, ['Tomato', '100']);
  const tree = h.render('AddCropScreen'); assert.equal(button(tree, 'Add Crop').props.disabled, false); button(tree, 'Add Crop').props.onPress();
  await new Promise(r => setImmediate(r));
  assert.deepEqual(h.calls, [['addCrop', 'Tomato', 100], ['refresh'], ['CropDetails', { cropKey: 'tomato' }]]);
  assert.equal(nodes(tree).some(n => n.props.label?.includes('Grade')), false);
});
test('duplicate Add Crop offers Crop Details and refreshes after server conflict', async () => {
  const d = farm(); d.crops = []; const h = harness(d, ['Tomato', '100']);
  h.mutations.addCrop = async () => { throw new ApiError(409, 'CROP_ALREADY_EXISTS', 'Use Add Produce.'); };
  button(h.render('AddCropScreen'), 'Add Crop').props.onPress(); await new Promise(r => setImmediate(r));
  const retry = h.render('AddCropScreen'); assert.ok(button(retry, 'Crop Details / Add Produce')); assert.deepEqual(h.calls, [['refresh']]);
});
test('Add Produce offers only current crops and locks the selected crop from Crop Details', async () => {
  const h = harness(farm(), ['Tomato', '50']); const tree = h.render('AddProduceScreen', { cropKey: 'tomato' });
  assert.equal(nodes(tree).some(n => n.props.title === 'Onion' || n.props.title === 'Potato'), false);
  button(tree, 'Add Produce').props.onPress(); await new Promise(r => setImmediate(r)); assert.deepEqual(h.calls[0], ['addProduce', 'Tomato', 50]); assert.deepEqual(h.calls[1], ['refresh']);
});
test('Available Produce renders sellable batches only and canonical Sell selection', () => {
  const h = harness(); const tree = h.render('AvailableProduceScreen');
  assert.equal(nodes(tree).filter(n => n.props.batch).length, 1);
  button(tree, 'Sell available').props.onPress(); assert.deepEqual(h.calls[0], ['Sell', { screen: 'SelectBatch', params: { crop: 'Tomato' } }]);
});
test('Crop Details uses canonical Sell and Market routes; unavailable crop directs Add Crop', () => {
  const h = harness(); const tree = h.render('CropDetailsScreen', { cropKey: 'tomato' });
  button(tree, 'Sell Produce').props.onPress(); const market = nodes(tree).find(n => n.props.crop === 'Tomato' && n.props.onPress)!; market.props.onPress();
  assert.deepEqual(h.calls, [['Sell', { screen: 'SelectBatch', params: { crop: 'Tomato' } }], ['Insights', { screen: 'MarketDetails', params: { crop: 'Tomato' } }]]);
  assert.ok(button(h.render('CropDetailsScreen', { cropKey: 'onion' }), 'Add Crop'));
});
test('Batch Details keeps null grade and routes existing listings instead of relisting', () => {
  const h = harness(); let tree = h.render('BatchDetailsScreen', { batchId: 'available' });
  assert.ok(nodes(tree).some(n => n.props.children === 'Not declared'));
  button(tree, 'Sell Produce').props.onPress(); assert.deepEqual(h.calls[0], ['Sell', { screen: 'Quality', params: { batchId: 'available' } }]);
  h.workspace.data.items = [{ id: 'listing', batch: { id: 'available' }, status: 'active', endsAt: '2099-01-01T00:00:00Z' }]; tree = h.render('BatchDetailsScreen', { batchId: 'available' });
  assert.equal(button(tree, 'Sell Produce'), undefined); button(tree, 'Current Listing').props.onPress(); assert.deepEqual(h.calls[1], ['Sell', { screen: 'Item', params: { itemId: 'listing' } }]);
});
test('Map missing-coordinate state disables link; farm edit preserves omitted coordinates', async () => {
  const h = harness(); assert.equal(button(h.render('FarmLocationScreen'), 'Open in Maps').props.disabled, true);
  const edit = harness(farm(), ['5', 'Village, Pune']); button(edit.render('EditFarmScreen'), 'Save Farm').props.onPress(); await new Promise(r => setImmediate(r));
  assert.deepEqual(edit.calls, [['editFarm', { locationLabel: 'Village, Pune', farmAreaAcres: 5 }], ['refresh']]);
});

test('missing Batch Details offers a working farm refresh', async () => {
  const h = harness();
  const tree = h.render('BatchDetailsScreen', { batchId: 'missing' });
  assert.ok(nodes(tree).some(n => n.props.children === 'Batch unavailable. Refresh your farm.'));
  button(tree, 'Refresh My Farm').props.onPress();
  await new Promise(r => setImmediate(r));
  assert.deepEqual(h.calls, [['refresh']]);
});
