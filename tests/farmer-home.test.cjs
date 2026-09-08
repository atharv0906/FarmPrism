const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let rpcResult = { data: null, error: null };
let mock = true;
const calls = [];
const navigations = [], alerts = [];
const fakeClient = { rpc: async (...args) => { calls.push(args); return rpcResult; } };
function load(relative) {
  const filename = path.resolve(root, relative);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  const localRequire = id => {
    if (id === 'react-native') return { Alert: { alert: (...args) => alerts.push(args) } };
    if (id === '@react-navigation/native') return { useNavigation: () => ({ navigate: (...args) => navigations.push(args) }) };
    if (id.endsWith('/client')) return { requireSupabaseClient: () => fakeClient };
    if (id.endsWith('/otp.strategy')) return { isDevelopmentMockOtpEnabled: () => mock };
    if (id.endsWith('/dashboardAssets')) return { dashboardAssets: new Proxy({}, { get: (_, key) => String(key) }) };
    if (id.startsWith('.')) return load(path.relative(root, path.resolve(path.dirname(filename), id + '.ts')));
    return require(id);
  };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename })(localRequire, module, module.exports);
  return module.exports;
}
const { parseDemoAccount, parseFarmerHome } = load('src/services/demo/demo.parsers.ts');
const { mapFarmerHome, createDashboardFallback } = load('src/components/farmer-dashboard/dashboardData.ts');
const { demoService } = load('src/services/demo/demo.service.ts');
const summary = () => ({ farmer: { id: 'test', name: 'Test Farmer', location: 'Test Location' },
  farm: { cropCount: 4, totalAcres: 7.5, quantityUnit: 'Quintals', availableQuantity: 8, availableQuantityKg: 800 },
  topOpportunity: { unit: 'Quintal', cropId: 'onion-id', cropName: 'Onion', buyerCount: 2, highestOfferPerQuintal: 3100, marketReferencePerQuintal: 3200, differencePerQuintal: -100 },
  marketPrices: [{ unit: 'Quintal', cropId: 'onion-id', cropName: 'Onion', pricePerQuintal: 3200, changePercent: -3.2 }],
  sellingActivity: { currency: 'INR', activeAuctions: 4, newOffers: 2, soldThisMonth: 9200 }, notifications: { unreadCount: 2 } });
test('fixed account rejects unsupported roles and malformed responses', () => {
  assert.equal(parseDemoAccount(null), null);
  assert.throws(() => parseDemoAccount({ isDemo: true, role: 'fpo' }));
  assert.throws(() => parseFarmerHome({}));
});
test('maps returned identity, quantity, non-Tomato opportunity and declining market', () => {
  const data = mapFarmerHome(parseFarmerHome(summary()));
  assert.equal(data.fullName, 'Test Farmer'); assert.equal(data.farm.acres, '7.5');
  assert.equal(data.farm.availableQuantityKg, 800); assert.equal(data.opportunity.cropId, 'onion-id');
  assert.equal(data.opportunity.image, 'onion'); assert.equal(data.opportunity.highestOffer, 3100);
  assert.equal(data.opportunity.differencePerUnit, -100); assert.equal(data.market[0].direction, '↘');
  assert.equal(data.notifications.unreadCount, 2);
});
test('empty data never substitutes a populated prototype or fake sales', () => {
  const raw = summary(); raw.topOpportunity = null; raw.farm.cropCount = 0;
  raw.sellingActivity = { currency: 'INR', activeAuctions: 0, newOffers: 0, soldThisMonth: 0 };
  const data = mapFarmerHome(parseFarmerHome(raw));
  assert.equal(data.opportunity, null); assert.equal(data.farm.crops, 0);
  assert.deepEqual(data.activity.map(x => x.emptyMessage), ['No auctions yet', 'No offers yet', 'No sales yet']);
  assert.equal(data.activity[2].value, '—');
  const fallback = createDashboardFallback({ fullName: '', village: '', district: '', state: '', crops: [], farmSize: '' });
  assert.equal(fallback.opportunity, null); assert.equal(fallback.market.length, 0); assert.equal(fallback.farm.quintals, '—');
});
test('read failures propagate; mark-read requires confirmed success and correct account context', async () => {
  rpcResult = { data: null, error: { message: 'offline' } };
  await assert.rejects(demoService.farmerHome('+919000000001'), /offline/);
  rpcResult = { data: false, error: null };
  await assert.rejects(demoService.markNotificationRead('+919000000001', 'notification-id'), /retry/);
  rpcResult = { data: true, error: null };
  await demoService.markNotificationRead('+919000000001', 'notification-id');
  assert.deepEqual(calls.at(-1), ['mark_demo_notification_read', { p_phone: '+919000000001', p_notification_id: 'notification-id' }]);
  mock = false;
  await assert.rejects(demoService.notifications('+919000000001'), /development mode/);
  mock = true;
});
test('every canonical Home destination navigates or responds with context', () => {
  const { useFarmerHomeAction } = load('src/hooks/useFarmerHomeAction.ts');
  const open = useFarmerHomeAction();
  open('Notifications'); open('My Farm'); open('Farmer Profile');
  assert.deepEqual(navigations, [['Notifications'], ['MyFarm'], ['Personal']]);
  const destinations = ['Sell > Buyer Offers', 'Insights > Market Prices', 'Insights > Crop Market Details',
    'Sell > My Auctions', 'Offer Details', 'Sell > Selling History', 'Sell > Create Listing', 'Orders', 'Sell', 'Insights'];
  for (const destination of destinations) {
    open(destination, { cropId: 'onion-id', cropName: 'Onion' });
    assert.equal(alerts.at(-1)[0], 'Coming Soon');
    assert.ok(alerts.at(-1)[1].includes(destination));
    assert.ok(alerts.at(-1)[1].includes('Onion'));
    assert.ok(!alerts.at(-1)[1].includes('onion-id'), 'Do not display internal IDs in product copy');
  }
  assert.equal(navigations.length, 3, 'Unavailable tabs must not navigate or change selection');
});

test('My Farm prototype keeps kg totals consistent and supports both empty states', () => {
  const { myFarmPrototype, myFarmEmptyStates, quintals, myFarmIntentMessage } = load('src/components/farmer-my-farm/myFarmData.ts');
  assert.equal(myFarmPrototype.summary.cropCount, myFarmPrototype.crops.length);
  assert.equal(myFarmPrototype.summary.totalAvailableKg, myFarmPrototype.crops.reduce((sum, crop) => sum + crop.availableKg, 0));
  assert.equal(quintals(1200), '12 Quintals');
  assert.equal(myFarmEmptyStates.noCrops.crops.length, 0);
  assert.equal(myFarmEmptyStates.noCrops.summary.totalAvailableKg, 0);
  assert.ok(myFarmEmptyStates.noAvailableProduce.crops.every(crop => crop.availableKg === 0 && crop.batchCount === 0));
  assert.match(myFarmIntentMessage({ type: 'BATCHES', cropId: 'test', cropName: 'Onion' }), /Physical batches — Onion/);
});
