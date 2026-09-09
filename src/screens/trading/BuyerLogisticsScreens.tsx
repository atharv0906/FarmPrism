import { validAdvance } from '../../services/api/trading.validation';
import { useState } from 'react';
import { Text } from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TradingRoutes } from '../../navigation/TradingRoutes';
import { useTrading } from '../../hooks/useTrading';
import { useTradingAction } from '../../hooks/useTradingAction';
import { useAuth } from '../../hooks/useAuth';
import { marketplaceMutations as mutations } from '../../services/api/mutation.client';
import { Button, Card, Page, Field, money, date } from '../../components/trading/TradingUI';
import { ProfileCard } from './SharedScreens';
import { ApiError } from '../../services/api/api.client';
type Props<K extends keyof TradingRoutes> = NativeStackScreenProps<TradingRoutes, K>;

export function BuyerHomeScreen({ navigation }: Props<'BuyerHome'> | Props<'BuyerMarket'>) {
  const state = useTrading();
  const items = state.data?.items.filter(i => ['open', 'active', 'partially_sold'].includes(i.status) && Date.parse(i.endsAt) > Date.now()) ?? [];
  return <Page title="Buyer Marketplace" {...state} retry={() => void state.refresh()}>
    <Button title="Market Insights" onPress={() => navigation.navigate('Market')} />
    {state.data && <Card title="Your activity"><Text>Current bids: {state.data.offers.filter(o => o.kind === 'auction' && o.status === 'active').length}</Text>
      <Text>Orders: {state.data.orders.length}</Text></Card>}
    {(['auction', 'fixed'] as const).map(kind => <Card key={kind} title={kind === 'auction' ? 'Open auctions' : 'Fixed-price listings'}>
      {state.data && !items.some(i => i.kind === kind) && <Text>No active listings in this category.</Text>}
      {items.filter(i => i.kind === kind).map(i => <Card key={i.id} title={i.batch.crop}><Text>{i.remainingKg} KG · {money(i.pricePerKg)}/KG</Text>
        <Text>{state.data?.profiles.find(p => p.id === i.batch.farmerId)?.name} · {i.status}</Text>
        <Button title="View Details" onPress={() => navigation.navigate('Item', { itemId: i.id })} /></Card>)}
    </Card>)}
  </Page>;
}
export function BidFormScreen({ route, navigation }: Props<'BidForm'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  const item = state.data?.items.find(i => i.id === route.params.itemId);
  const [quantity, setQuantity] = useState(''), [price, setPrice] = useState(''), [advance, setAdvance] = useState('30');
  const [label, setLabel] = useState(''), [latitude, setLatitude] = useState(''), [longitude, setLongitude] = useState('');
  const q = Number(quantity), p = Number(price), a = Number(advance), lat = Number(latitude), lon = Number(longitude);
  const valid = item && (item.kind === 'auction' ? item.status === 'open' : ['active', 'partially_sold'].includes(item.status)) && Date.parse(item.endsAt) > Date.now() &&
    q > 0 && q <= item.remainingKg && Number.isFinite(q) && validAdvance(a) &&
    (item.kind === 'fixed' || (p >= item.pricePerKg && Number.isFinite(p))) && label.trim() && latitude.trim() && longitude.trim() &&
    Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lon) && lon >= -180 && lon <= 180;
  return <Page title={item?.kind === 'fixed' ? 'Purchase Request' : 'Place / Revise Bid'} loading={state.loading} error={action.error ?? state.error} retry={() => void state.refresh()}>
    {item && <Card title={item.batch.crop}><Text>{item.remainingKg} KG available · {money(item.pricePerKg)}/KG {item.kind === 'fixed' ? '(locked fixed price)' : 'reserve'}</Text>
      <Field label="Quantity (KG)" value={quantity} onChange={setQuantity} numeric />
      {item.kind === 'auction' && <Field label="Your price (₹/KG)" value={price} onChange={setPrice} numeric />}
      <Field label="Farmer advance (10–90%)" value={advance} onChange={setAdvance} numeric /><Field label="Delivery address" value={label} onChange={setLabel} />
      <Field label="Delivery latitude" value={latitude} onChange={setLatitude} numeric /><Field label="Delivery longitude" value={longitude} onChange={setLongitude} numeric />
      <Text>Quantity, delivery coordinates and advance terms are required. A revised bid preserves the previous bid in history.</Text>
      <Button title={action.pending ? 'Submitting…' : 'Submit'} disabled={!valid || action.pending} onPress={() => {
        if (!valid || !demoApiToken) return;
        const body = { quantityKg: q, advancePercent: a, delivery: { label, latitude: lat, longitude: lon } };
        if (item.kind === 'auction') void action.run(() => mutations.placeOrReviseBid(item.id, { ...body, pricePerKg: p }, { bearerToken: demoApiToken }), () => navigation.navigate('MyBids'));
        else void action.run(() => mutations.createPurchaseRequest(item.id, body, { bearerToken: demoApiToken }), () => navigation.navigate('MyBids'));
      }} />
    </Card>}
  </Page>;
}
export function MyBidsScreen({ navigation }: Props<'MyBids'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  return <Page title="My Bids / Purchase Requests" loading={state.loading} error={action.error ?? state.error} retry={() => void state.refresh()}>
    {state.data && !state.data.offers.length && <Text>No bids or requests yet. Open Market to find produce.</Text>}
    {state.data?.offers.map(o => <Card key={o.id} title={(o.kind === 'auction' ? 'Bid' : 'Fixed-price request') + ' · ' + state.data?.items.find(i => i.id === o.itemId)?.batch.crop}>
      <Text>{o.quantityKg} KG · {money(o.pricePerKg)}/KG · {o.advancePercent}% advance</Text><Text>{o.status} · {date(o.createdAt)}</Text>
      <Button title="View Listing" onPress={() => navigation.navigate('Item', { itemId: o.itemId })} />
      {o.kind === 'auction' && o.status === 'active' && <Button title="Revise Bid" onPress={() => navigation.navigate('BidForm', { itemId: o.itemId })} />}
      {['active', 'pending'].includes(o.status) && <Button title="Withdraw" disabled={action.pending} onPress={() => {
        if (!demoApiToken) return;
        void action.run<unknown>(() => o.kind === 'auction' ? mutations.withdrawBid(o.id, { bearerToken: demoApiToken }) : mutations.withdrawPurchaseRequest(o.id, { bearerToken: demoApiToken }));
      }} />}
    </Card>)}
  </Page>;
}
export function JobsScreen({ navigation, route }: Props<'Jobs'> | Props<'Active'> | Props<'LogisticsHome'> | Props<'History'>) {
  const state = useTrading();
  const jobs = state.data?.jobs.filter(j => route.name === 'Jobs' ? j.status === 'available' : route.name === 'History' ? ['completed', 'delivered'].includes(j.status) : route.name === 'Active' ? j.logisticsId === state.data?.me.id && !['completed', 'delivered', 'cancelled'].includes(j.status) : true) ?? [];
  return <Page title={route.name === 'LogisticsHome' ? 'Logistics Console' : route.name} {...state} retry={() => void state.refresh()}>
    {state.data && <Card title="Vehicle capacity"><Text>{state.data.me.capacity === null ? 'Capacity unavailable' : state.data.me.capacity + ' KG'} · {state.data.me.verification ?? 'Verification unavailable'}</Text></Card>}
    {state.data && !jobs.length && <Text>No jobs in this view. Pull up available jobs after a buyer pays the Farmer advance.</Text>}
    {jobs.map(j => { const order = state.data?.orders.find(o => o.id === j.orderId); return <Card key={j.id} title={j.crop + ' · ' + j.orderCode}>
      <Text>{j.quantityKg} KG · {j.status}</Text><Text>{j.pickup ?? 'Pickup unavailable'} → {j.delivery ?? 'Delivery unavailable'}</Text>
      <Button title="Job Details" onPress={() => navigation.navigate('Job', { jobId: j.id })} /></Card>; })}
  </Page>;
}
export function JobScreen({ route, navigation }: Props<'Job'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  const [fee, setFee] = useState(''), [otp, setOtp] = useState(''), [otpMessage, setOtpMessage] = useState<string | null>(null), [latitude, setLatitude] = useState(''), [longitude, setLongitude] = useState('');
  const job = state.data?.jobs.find(j => j.id === route.params.jobId), order = state.data?.orders.find(o => o.id === job?.orderId), options = { bearerToken: demoApiToken ?? '' };
  const assigned = job?.logisticsId === state.data?.me.id;
  async function actualLocation() {
    if (!job) return;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') throw new Error('Location permission was not granted. Enable it in Android settings or use the explicitly simulated development option.');
    const point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await mutations.updateTracking(job.id, { latitude: point.coords.latitude, longitude: point.coords.longitude, source: 'actual' }, options);
  }
  return <Page title="Logistics Job" loading={state.loading} error={otpMessage ?? action.error ?? state.error} retry={() => void state.refresh()}>
    {job ? <><Card title={job.orderCode + ' · ' + job.crop}><Text>{job.quantityKg} KG · {job.status}</Text>
      <Text>{job.pickup ?? 'Pickup unavailable'} → {job.delivery ?? 'Delivery unavailable'}</Text><Text>Fee: {money(job.fee)} · {job.feeStatus}</Text>
      {job.status === 'available' && <Button title="Claim Job" disabled={action.pending} onPress={() => void action.run(() => mutations.claimLogisticsJob(job.id, options))} />}
      {assigned && ['claimed', 'fee_rejected'].includes(job.status) && <><Field label="Proposed fee (₹)" value={fee} onChange={setFee} numeric />
        <Button title="Propose Logistics Fee" disabled={action.pending || !Number.isFinite(Number(fee)) || Number(fee) <= 0} onPress={() => void action.run(() => mutations.proposeLogisticsFee(job.id, { fee: Number(fee) }, options))} /></>}
      {assigned && job.status === 'advance_paid' && <Button title="Confirm Pickup" disabled={action.pending} onPress={() => void action.run(() => mutations.confirmPickup(job.id, options))} />}
      {assigned && ['pickup_confirmed', 'in_transit'].includes(job.status) && <>
        <Button title="Send actual device location" disabled={action.pending} onPress={() => void action.run(actualLocation)} />
        {__DEV__ && <Card title="Simulated tracking — development only"><Field label="Simulated latitude" value={latitude} onChange={setLatitude} numeric /><Field label="Simulated longitude" value={longitude} onChange={setLongitude} numeric />
          <Button title="Send simulated location" disabled={action.pending || !latitude.trim() || !longitude.trim() || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180}
            onPress={() => void action.run(() => mutations.updateTracking(job.id, { latitude: Number(latitude), longitude: Number(longitude), source: 'simulated' }, options))} /></Card>}
      </>}
      {assigned && order?.status === 'delivery_otp_pending' && <><Field label="Buyer Delivery OTP" value={otp} onChange={setOtp} numeric secure />
        <Button title="Verify Delivery OTP" disabled={action.pending || !/^\d{6}$/.test(otp)} onPress={() => { setOtpMessage(null); void action.run(() => mutations.verifyDeliveryOtp(job.orderId, { otp }, options), () => { setOtp(''); setOtpMessage('Delivery verified. Balance pending.'); }, error => {
          if (error instanceof ApiError && (error.code === 'INVALID_OTP' || error.code === 'OTP_ATTEMPTS_EXCEEDED')) {
            const attemptsRemaining = typeof error.details?.attemptsRemaining === 'number' ? error.details.attemptsRemaining : 0;
            setOtpMessage(attemptsRemaining > 0 ? `Incorrect delivery OTP. ${attemptsRemaining} attempts remaining.` : 'Too many incorrect attempts. Ask the buyer to generate a new delivery OTP.');
          }
        }); }} />
        <Text>Successful OTP verification confirms delivery. There is no additional confirmation step.</Text></>}
      {assigned && <Button title="View Order / Feedback" onPress={() => navigation.navigate('Order', { orderId: job.orderId })} />}
    </Card><ProfileCard profile={state.data?.profiles.find(p => p.id === order?.farmerId)} /><ProfileCard profile={state.data?.profiles.find(p => p.id === order?.buyerId)} /></> : state.data && <Text>This job is no longer available to this account. Refresh Jobs.</Text>}
  </Page>;
}
