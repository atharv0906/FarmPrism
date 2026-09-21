import * as listingState from '../src/services/api/listingState';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JsxEmit, ModuleKind, transpileModule } from 'typescript';
const require = createRequire(import.meta.url);
function load(file: string, dependencies: Record<string, unknown>) {
  const exports: Record<string, any> = {};
  const code = transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'exports', '__DEV__', code)((id: string) => id === 'react/jsx-runtime' ? require(id) : (id.endsWith('/listingState') ? listingState : dependencies[id] ?? {}), exports, true);
  return exports;
}
function nodes(value: any): any[] { return Array.isArray(value) ? value.flatMap(nodes) : value?.props ? [value, ...nodes(value.props.children)] : []; }
const ui = { ...Object.fromEntries(['FarmerPage','Card','SectionTitle','Field','Button','Badge','Page'].map(n => [n,n])), ui: {}, quintals: String, cropArtwork: () => 1 };
const native = { Text: 'Text', View: 'View', Image: 'Image', Platform: { select: () => 'serif' }, StyleSheet: { create: (s: unknown) => s } };
function screens(data: any, values: unknown[] = []) {
  let index = 0;
  const deps = {
    react: { useState: (initial: unknown) => [index < values.length ? values[index++] : initial, () => {}], useEffect() {} },
    'react-native': native,
    '../../hooks/useTrading': { useTrading: () => ({ data, loading: false, error: null, refresh: async () => {} }) },
    '../../hooks/useTradingAction': { useTradingAction: () => ({ pending: false }) },
    '../../hooks/useAuth': { useAuth: () => ({ demoApiToken: 'mock-session' }) },
    '../../components/farmer-sell/FarmerSellUI': ui,
    '../../components/farmprism-shell/RoleUI': ui,
  };
  return { farmer: () => load('src/screens/trading/FarmerSellScreens.tsx', deps), buyer: () => load('src/screens/trading/BuyerLogisticsScreens.tsx', deps) };
}

test('auction and fixed acceptance use minimum offer/listing/physical bounds, including the manual 55 KG remainder', () => {
  for (const kind of ['auction', 'fixed']) for (const [offerKg, listingKg, batchKg, q, disabled] of [
    [55,150,450,55,false], [55,150,450,56,true], [150,40,450,41,true], [150,450,30,31,true], [55,150,450,0,true],
  ] as const) {
    const data = { offers: [{ id:'offer', itemId:'item', kind, status:kind === 'auction' ? 'partially_accepted' : 'pending', remainingKg:offerKg }], items:[{ id:'item', kind, status:kind === 'auction' ? 'partially_sold' : 'active', endsAt:'2099-01-01T00:00:00Z', remainingKg:listingKg, batch:{ quantityKg:batchKg } }], profiles:[] };
    const tree = screens(data, [String(q)]).farmer().OfferScreen({ route:{ params:{ offerId:'offer' } }, navigation:{} });
    assert.equal(nodes(tree).find(n=>n.props.title === 'Accept Offer').props.disabled, disabled);
    assert.equal(nodes(tree).find(n=>n.props.label?.startsWith('Accept quantity')).props.label, `Accept quantity (KG), maximum ${Math.min(offerKg,listingKg,batchKg)}`);
  }
});

// Expected-behavior regressions deliberately remain red in this test-only audit.
for (const [screen, route, data, role] of [
  ['OfferScreen', { offerId:'missing' }, { offers:[], items:[] }, 'farmer'],
  ['CreateListingScreen', { batchId:'missing', kind:'auction' }, { batches:[] }, 'farmer'],
  ['BidFormScreen', { itemId:'missing' }, { items:[] }, 'buyer'],
] as const) test(`AUD-02 ${screen} explains a missing resource`, () => {
  const module = role === 'farmer' ? screens(data).farmer() : screens(data).buyer();
  const tree = module[screen]({ route:{ params:route }, navigation:{} });
  assert.ok(nodes(tree).some(n=>typeof n.props.children === 'string' && /unavailable|not found|no longer/i.test(n.props.children)), 'Expected an actionable unavailable-resource message');
});

test('AUD-03 clearing optional farm area persists null instead of silently preserving old area', async () => {
  const states = ['', 'Pune', null, false, null, false]; let index = 0, patch: any;
  const mod = load('src/screens/FarmerFarmScreens.tsx', {
    react: { useState: () => [states[index++], () => {}], useEffect() {}, useRef: () => ({ current:false }) },
    'react-native':native,
    '../hooks/useFarmerMyFarm':{ useFarmerMyFarm:()=>({ data:{ farm:{ area:3, location:'Pune' } }, refresh:async()=>{} }) },
    '../services/api/farmerInventory.client':{ farmerInventoryClient:{ editFarm:async(p:unknown)=>{ patch=p; } } },
    '../components/farmer-sell/FarmerSellUI':ui,
  });
  const tree = mod.EditFarmScreen({ navigation:{} });
  nodes(tree).find(n=>n.props.title === 'Save Farm').props.onPress();
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(patch.farmAreaAcres, null);
});

test('AUD-04 optional onboarding area rejects malformed decimal input before Review', () => {
  const draft = { state:'Maharashtra',district:'Pune',taluka:'Haveli',village:'Wagholi',crops:['Onion'],farmSize:'1..2' };
  const calls: unknown[] = [];
  const mod = load('src/screens/FarmerScreens.tsx', {
    react:{ createContext:()=>({}),useContext:()=>({draft,update() {}}),useState:(value:unknown)=>[value,()=>{}],useMemo:(fn:()=>unknown)=>fn() },
    'react-native':native,
  });
  const tree = mod.FarmerDetailsScreen({navigation:{navigate:(...args:unknown[])=>calls.push(args)}});
  const next = nodes(tree).find(n=>n.props.onPress && typeof n.props.label==='string' && /next|review|continue/i.test(n.props.label));
  assert.ok(next, 'Next button must exist'); next.props.onPress();
  assert.deepEqual(calls, [], 'Malformed optional area must not advance to Review');
});

test('AUD-05 expired partially sold auction remains visible in Selling History', () => {
  const data = { me:{role:'farmer'}, orders:[], items:[{ id:'expired-partial',kind:'auction',status:'partially_sold',endsAt:'2000-01-01T00:00:00Z',offeredKg:350,remainingKg:150,batch:{crop:'Onion'} }] };
  const mod = load('src/screens/trading/SharedScreens.tsx', {
    react:{useState:(initial:unknown)=>[initial,()=>{}]}, 'react-native':native,
    '../../hooks/useTrading':{useTrading:()=>({data,loading:false,error:null,refresh:async()=>{}})},
    '../../components/farmprism-shell/RoleUI':{...ui,SelectChip:'SelectChip'},
  });
  const tree = mod.OrdersScreen({route:{name:'History'},navigation:{}});
  assert.ok(nodes(tree).some(n=>n.props.title==='View Listing'), 'Expired partial auction must not disappear from both Market and History');
});
