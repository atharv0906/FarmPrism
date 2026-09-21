import { listingActive } from '../services/api/listingState';
import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { Image, Linking, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { FarmerStackParamList } from '../navigation/FarmerNavigator';
import { useFarmerMyFarm } from '../hooks/useFarmerMyFarm';
import { useRemote } from '../hooks/useRemote';
import { useTrading } from '../hooks/useTrading';
import { FarmerPage, Card, SectionTitle, Button, Field, Badge, cropArtwork, ui } from '../components/farmer-sell/FarmerSellUI';
import { farmerInventoryClient } from '../services/api/farmerInventory.client';
import { tradingClient } from '../services/api/trading.client';
import { currentFarmBatch, farmMapsUrl, validProduceQuantity } from '../services/api/farmerInventory.validation';
import type { FarmBatch, FarmPatch } from '../services/api/farmerSummary.types';
import type { Crop } from '../services/api/market.types';
import { ApiError } from '../services/api/api.client';
import * as Location from 'expo-location';

type Props<K extends keyof FarmerStackParamList> = NativeStackScreenProps<FarmerStackParamList, K>;
type State = ReturnType<typeof useFarmerMyFarm>;
const supported: readonly Crop[] = ['Tomato', 'Onion', 'Potato'];
const date = (value: string) => new Date(value).toLocaleString('en-IN');
function Page({ title, state, children, error }: PropsWithChildren<{ title: string; state: State; error?: string | null }>) {
  const insets = useSafeAreaInsets();
  return <FarmerPage title={title} back selectedTab="My Farm" hasData={!!state.data} loading={state.loading} error={state.error} mutationError={error} retry={() => void state.refresh()}><View style={{ gap: 12, paddingBottom: Math.max(insets.bottom, 12) }}>{state.data && children}</View></FarmerPage>;
}
function BatchCard({ batch, onPress }: { batch: FarmBatch; onPress: () => void }) {
  return <Card><SectionTitle title={batch.crop} icon={cropArtwork(batch.crop)} /><Text style={ui.value}>{batch.remainingQuantityKg} KG</Text><Text style={ui.muted}>{batch.qualityGrade === null ? 'Not declared' : `Farmer Declared Grade ${batch.qualityGrade}`}</Text><Badge>{batch.status}</Badge><Text style={ui.muted}>Created {date(batch.createdAt)}</Text><Button title="Batch Details" onPress={onPress} outline /></Card>;
}
export function FarmOverviewScreen({ navigation }: Props<'FarmOverview'>) {
  const state = useFarmerMyFarm(), d = state.data;
  return <Page title="Farm Overview" state={state}>{d && <Card><Text style={ui.value}>{d.farm.area ?? '—'} Acres · Total Land</Text><Button title={`${d.summary.cropCount} Crops`} onPress={() => navigation.navigate('MyCrops')} /><Button title={`${d.summary.totalAvailableKg} KG Available to Sell`} onPress={() => navigation.navigate('AvailableProduce')} /><Button title={`${d.summary.activeBatchCount} Active Batches`} onPress={() => navigation.navigate('CropBatches')} /><Button title="Edit Farm" onPress={() => navigation.navigate('EditFarm')} outline /></Card>}</Page>;
}
export function MyCropsScreen({ navigation }: Props<'MyCrops'>) {
  const state = useFarmerMyFarm();
  return <Page title="My Crops" state={state}>{!state.data?.crops.length && <Text style={ui.muted}>No current crops. Add your first produce batch to get started.</Text>}{state.data?.crops.map(c => <Card key={c.id}><SectionTitle title={c.name} icon={c.image} /><Text style={ui.value}>{c.availableKg} KG available</Text><Text style={ui.muted}>{c.batchCount} current physical batches</Text><Badge>{c.status}</Badge><Button title="Crop Details" onPress={() => navigation.navigate('CropDetails', { cropKey: c.id })} /></Card>)}<Button title="Add Crop" onPress={() => navigation.navigate('AddCrop')} /></Page>;
}
function AddInventory({ first, cropKey, navigation }: { first: boolean; cropKey?: string; navigation: Pick<Props<'AddCrop'>['navigation'], 'navigate' | 'replace'> }) {
  const state = useFarmerMyFarm();
  const [crop, setCrop] = useState<Crop | null>(supported.find(c => c.toLowerCase() === cropKey) ?? null);
  const [quantity, setQuantity] = useState(''), [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null), [conflict, setConflict] = useState<string | null>(null);
  const submitting = useRef(false);
  const current = state.data?.crops.map(c => c.name) ?? [];
  const allowed = crop !== null && (first ? !current.includes(crop) : current.includes(crop));
  async function submit() {
    if (!crop || !allowed || !validProduceQuantity(quantity) || submitting.current) return;
    submitting.current = true; setPending(true); setError(null); setConflict(null);
    try { await (first ? farmerInventoryClient.addCrop(crop, Number(quantity)) : farmerInventoryClient.addProduce(crop, Number(quantity))); await state.refresh(); navigation.replace('CropDetails', { cropKey: crop.toLowerCase() }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save produce.'); if (e instanceof ApiError && e.status === 409) { setConflict(e.code); await state.refresh(); } }
    finally { submitting.current = false; setPending(false); }
  }
  return <Page title={first ? 'Add Crop' : 'Add Produce'} state={state} error={error}><Card><Text style={ui.muted}>{first ? 'Create the first physical batch for a new crop.' : 'Add a separate physical batch to a current crop.'}</Text>{supported.filter(c => first || current.includes(c)).map(c => <Button key={c} title={`${c}${current.includes(c) && first ? ' · Already added — use Add Produce' : crop === c ? ' · Selected' : ''}`} outline={crop !== c} disabled={pending || (first && current.includes(c)) || (!!cropKey && crop !== c)} onPress={() => setCrop(c)} />)}{first && current.length > 0 && <Button title="View current crops / Add Produce" onPress={() => navigation.navigate('MyCrops')} outline />}{!first && !current.length && <Button title="Add Crop" onPress={() => navigation.navigate('AddCrop')} />}<Field label={first ? 'Initial Quantity (KG)' : 'Quantity (KG)'} numeric value={quantity} onChange={setQuantity} />{!!quantity && !validProduceQuantity(quantity) && <Text style={ui.error}>Enter 0.01–1,000,000 KG, with at most two decimal places.</Text>}<Button title={pending ? 'Saving…' : first ? 'Add Crop' : 'Add Produce'} disabled={pending || state.loading || !allowed || !validProduceQuantity(quantity)} onPress={() => void submit()} />{conflict === 'CROP_ALREADY_EXISTS' && crop && <Button title="Crop Details / Add Produce" onPress={() => navigation.navigate('CropDetails', { cropKey: crop.toLowerCase() })} />}{conflict === 'CROP_NOT_ACTIVE' && <Button title="Add Crop" onPress={() => navigation.navigate('AddCrop')} />}</Card></Page>;
}
export function AddCropScreen({ navigation }: Props<'AddCrop'>) { return <AddInventory first navigation={navigation} />; }
export function AddProduceScreen({ navigation, route }: Props<'AddProduce'>) { return <AddInventory first={false} navigation={navigation} cropKey={route.params?.cropKey} />; }
function CropMarket({ crop, onPress }: { crop: Crop; onPress: () => void }) {
  const state = useRemote(useCallback(() => tradingClient.current(crop), [crop]));
  return <Card><SectionTitle title="Current Market Price" /><Text style={ui.value}>{state.data ? `₹${(state.data.modalPricePerKg * 100).toLocaleString('en-IN')} / Quintal` : state.loading ? 'Loading…' : 'Market price unavailable'}</Text>{state.data && <Text style={ui.muted}>{state.data.mandi} · {new Date(state.data.observedAt).toLocaleDateString('en-IN')}</Text>}<Button title="Market Price" onPress={onPress} outline /></Card>;
}
export function CropDetailsScreen({ navigation, route }: Props<'CropDetails'>) {
  const state = useFarmerMyFarm(), crop = state.data?.crops.find(c => c.id === route.params.cropKey);
  return <Page title="Crop Details" state={state}>{crop ? <><Card><Image source={crop.image} style={{ width: 100, height: 100 }} resizeMode="contain" /><SectionTitle title={crop.name} /><Text style={ui.value}>{crop.availableKg} KG available</Text><Text style={ui.muted}>{crop.batchCount} current physical batches</Text><Button title="Add Produce" onPress={() => navigation.navigate('AddProduce', { cropKey: crop.id })} /><Button title="Physical Batches" onPress={() => navigation.navigate('CropBatches', { cropKey: crop.id })} outline /><Button title="Sell Produce" onPress={() => navigation.navigate('Sell', { screen: 'SelectBatch', params: { crop: crop.name } })} /></Card>{state.data?.batches.filter(b => b.crop === crop.name && currentFarmBatch(b)).map(b => <BatchCard key={b.id} batch={b} onPress={() => navigation.navigate('BatchDetails', { batchId: b.id })} />)}<CropMarket crop={crop.name} onPress={() => navigation.navigate('Insights', { screen: 'MarketDetails', params: { crop: crop.name } })} /></> : <Card><Text style={ui.muted}>This crop has no current physical produce.</Text><Button title="Add Crop" onPress={() => navigation.navigate('AddCrop')} /></Card>}</Page>;
}
export function CropBatchesScreen({ navigation, route }: Props<'CropBatches'>) {
  const state = useFarmerMyFarm(), batches = state.data?.batches.filter(b => currentFarmBatch(b) && (!route.params?.cropKey || b.crop.toLowerCase() === route.params.cropKey)) ?? [];
  return <Page title="Physical Batches" state={state}>{batches.map(b => <BatchCard key={b.id} batch={b} onPress={() => navigation.navigate('BatchDetails', { batchId: b.id })} />)}{!batches.length && <Text style={ui.muted}>No current physical batches.</Text>}<Button title={state.data?.crops.length ? 'Add Produce' : 'Add Crop'} onPress={() => state.data?.crops.length ? navigation.navigate('AddProduce', route.params) : navigation.navigate('AddCrop')} /></Page>;
}
export function AvailableProduceScreen({ navigation }: Props<'AvailableProduce'>) {
  const state = useFarmerMyFarm(), batches = state.data?.batches.filter(b => b.sellable) ?? [];
  return <Page title="Available Produce" state={state}>{batches.map(b => <View key={b.id} style={{ gap: 8 }}><BatchCard batch={b} onPress={() => navigation.navigate('BatchDetails', { batchId: b.id })} /><Button title={`Sell ${b.crop}`} onPress={() => navigation.navigate('Sell', { screen: 'SelectBatch', params: { crop: b.crop } })} /></View>)}{!batches.length && <Text style={ui.muted}>No produce available to sell.</Text>}<Button title={state.data?.crops.length ? 'Add Produce' : 'Add Crop'} onPress={() => state.data?.crops.length ? navigation.navigate('AddProduce') : navigation.navigate('AddCrop')} /></Page>;
}
export function BatchDetailsScreen({ navigation, route }: Props<'BatchDetails'>) {
  const state = useFarmerMyFarm(), workspace = useTrading(), batch = state.data?.batches.find(b => b.id === route.params.batchId);
  const listing = workspace.data?.items.find(i => i.batch.id === batch?.id && listingActive(i));
  return <Page title="Batch Details" state={state}>{batch ? <Card><SectionTitle title={batch.crop} icon={cropArtwork(batch.crop)} /><Text style={ui.value}>Original: {batch.originalQuantityKg} KG</Text><Text style={ui.value}>Remaining: {batch.remainingQuantityKg} KG</Text><Badge>{batch.status}</Badge><Text style={ui.muted}>{batch.qualityGrade === null ? 'Not declared' : `Farmer Declared Grade ${batch.qualityGrade}`}</Text><Text style={ui.muted}>Created {date(batch.createdAt)}{'\n'}Updated {date(batch.updatedAt)}</Text>{listing ? <Button title="Current Listing" onPress={() => navigation.navigate('Sell', { screen: 'Item', params: { itemId: listing.id } })} /> : batch.sellable && <Button title="Sell Produce" disabled={!workspace.data || workspace.loading} onPress={() => navigation.navigate('Sell', { screen: 'Quality', params: { batchId: batch.id } })} />}{workspace.error && <Text style={ui.error}>{workspace.error}</Text>}</Card> : <Card><Text style={ui.muted}>Batch unavailable. Refresh your farm.</Text><Button title="Refresh My Farm" onPress={() => void state.refresh()} /></Card>}</Page>;
}
export function FarmActivitiesScreen({ navigation }: Props<'FarmActivities'>) {
  const state = useFarmerMyFarm();
  return <Page title="Farm Activities" state={state}>{state.data?.activityEvents.map(e => <Card key={e.id}><SectionTitle title={`${e.type} · ${e.crop}`} /><Text style={ui.muted}>{date(e.at)}</Text><Button title="View Batch" onPress={() => navigation.navigate('BatchDetails', { batchId: e.batchId })} outline /></Card>)}{!state.data?.activityEvents.length && <Text style={ui.muted}>No farm activities yet. Add your first crop to get started.</Text>}</Page>;
}
export function FarmLocationScreen({ navigation }: Props<'FarmLocation'>) {
  const state = useFarmerMyFarm(), farm = state.data?.farm, url = farm ? farmMapsUrl(farm) : null;
  const [error, setError] = useState<string | null>(null);
  return <Page title="Farm Location" state={state} error={error}><Card><Text style={ui.value}>{farm?.location || 'Location not added'}</Text><Text style={ui.muted}>{farm?.area ?? '—'} Acres</Text><Text style={ui.muted}>{url ? 'Saved coordinates available' : 'Location coordinates not available. Edit Farm to save your location.'}</Text><Button title="Open in Maps" disabled={!url} onPress={() => { if (url) void Linking.openURL(url).catch(() => setError('Unable to open Maps. Please try again.')); }} /><Button title="Edit Farm" onPress={() => navigation.navigate('EditFarm')} outline /></Card></Page>;
}
export function EditFarmScreen({ navigation }: Props<'EditFarm'>) {
  const state = useFarmerMyFarm(), [area, setArea] = useState(''), [label, setLabel] = useState(''), [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null), [success, setSuccess] = useState(false), loaded = useRef(false), submitting = useRef(false);
  useEffect(() => { if (state.data && !loaded.current) { loaded.current = true; setArea(state.data.farm.area?.toString() ?? ''); setLabel(state.data.farm.location); } }, [state.data]);
  async function locate() {
    setPending(true); setError(null);
    try { if ((await Location.requestForegroundPermissionsAsync()).status !== 'granted') throw new Error('Location permission was not granted. You can still edit the location text.'); const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }); setCoordinates({ latitude: p.coords.latitude, longitude: p.coords.longitude }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to get your location.'); } finally { setPending(false); }
  }
  const valid = label.trim().length <= 200 && (area.trim() === '' || (/^\d+(\.\d+)?$/.test(area) && Number.isFinite(Number(area)) && Number(area) >= 0 && Number(area) <= 100_000));
  async function save() {
    if (!valid || submitting.current) return;
    submitting.current = true; setPending(true); setError(null); setSuccess(false);
    const patch: FarmPatch = { locationLabel: label.trim(), farmAreaAcres: area.trim() ? Number(area) : null, ...(coordinates ?? {}) };
    try { await farmerInventoryClient.editFarm(patch); await state.refresh(); setSuccess(true); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save farm.'); } finally { submitting.current = false; setPending(false); }
  }
  return <Page title="Edit Farm" state={state} error={error}><Card><Field label="Farm Size (Acres, optional)" numeric value={area} onChange={setArea} /><Field label="Farm Location" value={label} onChange={setLabel} /><Button title={pending ? 'Working…' : 'Use Current Location'} disabled={pending} onPress={() => void locate()} outline /><Text style={ui.muted}>{coordinates ? 'Current coordinates ready to save.' : 'Saved coordinates are preserved when you edit text.'}</Text>{!valid && <Text style={ui.error}>Use a location up to 200 characters and a farm size from 0 to 100,000 acres.</Text>}<Button title={pending ? 'Saving…' : 'Save Farm'} disabled={!valid || pending} onPress={() => void save()} />{success && <><Text accessibilityRole="alert" style={ui.muted}>Farm saved successfully.</Text><Button title="Back to My Farm" onPress={() => navigation.navigate('MyFarm')} outline /></>}</Card></Page>;
}
