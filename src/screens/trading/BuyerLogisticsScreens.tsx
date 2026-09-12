import { dashboardAssets as d } from '../../components/farmer-dashboard/dashboardAssets';
import { validAdvance } from '../../services/api/trading.validation';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TradingRoutes } from '../../navigation/TradingRoutes';
import { useTrading } from '../../hooks/useTrading';
import { useTradingAction } from '../../hooks/useTradingAction';
import { useAuth } from '../../hooks/useAuth';
import { marketplaceMutations as mutations } from '../../services/api/mutation.client';
import { Button, Card, Page, Field, money, date, Metric, ActionTile, Badge, SelectChip, cropArtwork, ui } from '../../components/farmprism-shell/RoleUI';
import { ProfileCard } from './SharedScreens';
import { ApiError } from '../../services/api/api.client';
type Props<K extends keyof TradingRoutes> = NativeStackScreenProps<TradingRoutes, K>;

export function BuyerHomeScreen({ navigation, route }: Props<'BuyerHome'> | Props<'BuyerMarket'>) {
  const state = useTrading(), data = state.data;
  const [category, setCategory] = useState<'auction' | 'fixed'>('auction');
  const items = data?.items.filter(i => ['open', 'active', 'partially_sold'].includes(i.status) && Date.parse(i.endsAt) > Date.now()) ?? [];
  const home = route.name === 'BuyerHome';
  return <Page title={home ? 'Your Marketplace' : 'Fresh from the Farm'} {...state} retry={() => void state.refresh()}>
    {data && <>
      {home && <><ProfileCard profile={data.me} /><Card title="Your activity"><View style={ui.metricRow}>
        <Metric value={items.filter(i => i.kind === 'auction').length} label="Open Auctions" icon={d.offer} />
        <Metric value={items.filter(i => i.kind === 'fixed').length} label="Fixed Listings" icon={d.listing} />
        <Metric value={data.offers.filter(o => ['active', 'pending', 'partially_accepted'].includes(o.status)).length} label="Bids / Requests" icon={d.buyers} />
        <Metric value={data.orders.length} label="Orders" icon={d.orders} /></View></Card>
        <ActionTile title="Explore the Market" icon={d.market} detail="Find produce and compare offers" onPress={() => navigation.navigate('BuyerMarket')} />
      </>}
      <ActionTile title="Market Insights" icon={d.navInsights} detail="Current mandi prices" onPress={() => navigation.navigate('Market')} />
      <View style={ui.toggleRow}><SelectChip label="Auctions" selected={category === 'auction'} onPress={() => setCategory('auction')} /><SelectChip label="Fixed Price" selected={category === 'fixed'} onPress={() => setCategory('fixed')} /></View>
      {!items.some(i => i.kind === category) && <Card title="No listings right now"><Text style={ui.muted}>New produce will appear here when farmers publish it.</Text></Card>}
      {items.filter(i => i.kind === category).map(i => { const farmer = data.profiles.find(p => p.id === i.batch.farmerId); return <Card key={i.id}>
        <View style={ui.listingTop}><Image source={cropArtwork(i.batch.crop)} style={ui.cropImage} resizeMode="contain" /><View style={ui.listingCopy}><Text style={ui.cropTitle}>{i.batch.crop}</Text><Badge>{i.kind === 'auction' ? 'AUCTION' : 'FIXED PRICE'}</Badge><Text style={ui.muted}>Farmer Declared Grade {i.batch.grade ?? 'Not declared'}</Text></View></View>
        <View style={ui.priceRow}><View style={ui.priceMetric}><Text style={ui.small}>AVAILABLE</Text><Text style={ui.priceMetricValue}>{i.remainingKg} KG</Text></View><View style={ui.priceMetric}><Text style={ui.small}>{i.kind === 'auction' ? 'RESERVE' : 'FIXED PRICE'}</Text><Text style={ui.priceMetricValue}>{money(i.pricePerKg)}/KG</Text></View></View>
        <Text style={ui.muted}>{farmer?.name ?? 'Farmer'} · Trust Score {farmer?.trustScore == null ? 'Not available' : farmer.trustScore + '/100'}</Text><Text style={ui.muted}>Ends {date(i.endsAt)}</Text>
        <Button title="View Details" onPress={() => navigation.navigate('Item', { itemId: i.id })} /></Card>; })}
    </>}
  </Page>;
}
export function BidFormScreen({ route, navigation }: Props<'BidForm'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  const item = state.data?.items.find(i => i.id === route.params.itemId);
  const [quantity, setQuantity] = useState(''), [price, setPrice] = useState(''), [advance, setAdvance] = useState('30');
  const [label, setLabel] = useState(''), [latitude, setLatitude] = useState(''), [longitude, setLongitude] = useState('');
  const [editDelivery, setEditDelivery] = useState(false);
  const savedDelivery = state.data?.deliveryLocation;
  useEffect(() => { if (savedDelivery && !editDelivery) { setLabel(savedDelivery.label); setLatitude(savedDelivery.latitude?.toString() ?? ''); setLongitude(savedDelivery.longitude?.toString() ?? ''); } }, [savedDelivery?.label, savedDelivery?.latitude, savedDelivery?.longitude, editDelivery]);
  const q = Number(quantity), p = Number(price), a = Number(advance), lat = Number(latitude), lon = Number(longitude);
  const valid = item && (item.kind === 'auction' ? item.status === 'open' : ['active', 'partially_sold'].includes(item.status)) && Date.parse(item.endsAt) > Date.now() &&
    q > 0 && q <= item.remainingKg && Number.isFinite(q) && validAdvance(a) &&
    (item.kind === 'fixed' || (p >= item.pricePerKg && Number.isFinite(p))) && label.trim() && latitude.trim() && longitude.trim() &&
    Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lon) && lon >= -180 && lon <= 180;
  return <Page title={item?.kind === 'fixed' ? 'Purchase Request' : 'Place / Revise Bid'} hasData={!!state.data} loading={state.loading} error={state.error} mutationError={action.error} retry={() => void state.refresh()}>
    {item && <Card title={item.batch.crop}><Text style={ui.muted}>{item.remainingKg} KG available · {money(item.pricePerKg)}/KG {item.kind === 'fixed' ? '(locked fixed price)' : 'reserve'}</Text>
      <Field label="Quantity (KG)" value={quantity} onChange={setQuantity} numeric />
      {item.kind === 'auction' && <Field label="Your price (₹/KG)" value={price} onChange={setPrice} numeric />}
      <Field label="Farmer advance (10–90%)" value={advance} onChange={setAdvance} numeric />
      <Card title="Delivery location"><Text style={ui.muted}>{label || 'Add your delivery address below.'}</Text>
        {savedDelivery && <Button title="Use saved delivery location" onPress={() => { setEditDelivery(false); setLabel(savedDelivery.label); setLatitude(savedDelivery.latitude?.toString() ?? ''); setLongitude(savedDelivery.longitude?.toString() ?? ''); }} />}
        <Button title={editDelivery ? 'Hide delivery editing' : 'Edit delivery location'} onPress={() => setEditDelivery(!editDelivery)} />
        {(editDelivery || !savedDelivery) && <><Field label="Delivery address" value={label} onChange={setLabel} /><Text style={ui.muted}>Advanced: confirm the delivery coordinates.</Text><Field label="Delivery latitude" value={latitude} onChange={setLatitude} numeric /><Field label="Delivery longitude" value={longitude} onChange={setLongitude} numeric /></>}
      </Card><Text style={ui.muted}>Advance must be 10–90%. Previous bids remain in your history.</Text>
      <Button primary title={action.pending ? 'Submitting…' : 'Submit'} disabled={!valid || action.pending} onPress={() => {
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
  const [group, setGroup] = useState('Active');
  const statuses: Record<string, string[]> = { Active: ['active', 'pending', 'partially_accepted'], History: ['revised', 'superseded', 'expired'], Accepted: ['accepted'], Rejected: ['rejected'], Withdrawn: ['withdrawn'] };
  return <Page title="My Bids / Purchase Requests" hasData={!!state.data} loading={state.loading} error={state.error} mutationError={action.error} retry={() => void state.refresh()}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{Object.keys(statuses).map(label => <SelectChip key={label} label={label} selected={group === label} onPress={() => setGroup(label)} />)}</ScrollView>
    {state.data && !state.data.offers.some(o => statuses[group].includes(o.status) || (group === 'History' && !Object.values(statuses).flat().includes(o.status))) && <Card title={`No ${group.toLowerCase()} bids or requests`}><Text style={ui.muted}>Open Market to find produce or choose another status.</Text></Card>}
    {state.data?.offers.filter(o => statuses[group].includes(o.status) || (group === 'History' && !Object.values(statuses).flat().includes(o.status))).map(o => <Card key={o.id} title={(o.kind === 'auction' ? 'Bid' : 'Fixed-price request') + ' · ' + (state.data?.items.find(i => i.id === o.itemId)?.batch.crop ?? 'Produce')}>
      <Text style={ui.muted}>{o.quantityKg} KG · {money(o.pricePerKg)}/KG · {o.advancePercent}% advance</Text><Badge>{o.status.replaceAll('_', ' ')}</Badge><Text style={ui.muted}>{date(o.createdAt)}</Text>
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
  return <Page title={route.name === 'LogisticsHome' ? 'Your Deliveries' : route.name} {...state} retry={() => void state.refresh()}>
    {state.data && route.name === 'LogisticsHome' && <><ProfileCard profile={state.data.me} /><Card title="Delivery overview"><View style={ui.metricRow}><Metric value={state.data.jobs.filter(j => j.status === 'available').length} label="Available Jobs" icon={d.orders} /><Metric value={state.data.jobs.filter(j => j.logisticsId === state.data?.me.id && !['completed', 'delivered', 'cancelled'].includes(j.status)).length} label="Active Jobs" icon={d.listing} /><Metric value={state.data.me.completedTransactions ?? 'Not available'} label="Completed" icon={d.opportunity} /></View></Card></>}
    {state.data && !jobs.length && <Text style={ui.muted}>No jobs in this view. Pull up available jobs after a buyer pays the Farmer advance.</Text>}
    {jobs.map(j => { return <Card key={j.id} title={j.crop + ' · ' + j.orderCode}>
      <View style={ui.listingTop}><Image source={cropArtwork(j.crop)} style={ui.cropImage} resizeMode="contain" /><View style={ui.listingCopy}><Text style={ui.value}>{j.quantityKg} KG</Text><Badge>{j.status.replaceAll('_', ' ')}</Badge></View></View><Text style={ui.muted}>{j.pickup ?? 'Pickup unavailable'} → {j.delivery ?? 'Delivery unavailable'}</Text>
      <Button title="Job Details" onPress={() => navigation.navigate('Job', { jobId: j.id })} /></Card>; })}
  </Page>;
}
export function JobScreen({ route, navigation }: Props<'Job'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  const [fee, setFee] = useState(''), [otp, setOtp] = useState(''), [otpMessage, setOtpMessage] = useState<string | null>(null), [latitude, setLatitude] = useState(''), [longitude, setLongitude] = useState('');
  const job = state.data?.jobs.find(j => j.id === route.params.jobId), order = state.data?.orders.find(o => o.id === job?.orderId), options = { bearerToken: demoApiToken ?? '' };
  const [showSimulation, setShowSimulation] = useState(false);
  const assigned = job?.logisticsId === state.data?.me.id;
  async function actualLocation() {
    if (!job) return;
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') throw new Error('Location permission was not granted. Enable it in Android settings or use the explicitly simulated development option.');
    const point = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await mutations.updateTracking(job.id, { latitude: point.coords.latitude, longitude: point.coords.longitude, source: 'actual' }, options);
  }
  return <Page title="Logistics Job" hasData={!!state.data} loading={state.loading} error={state.error} mutationError={action.error} retry={() => void state.refresh()}>
    {otpMessage && <Card><Text accessibilityRole="alert" style={ui.muted}>{otpMessage}</Text></Card>}{job ? <><Card title={job.orderCode + ' · ' + job.crop}><Text style={ui.muted}>{job.quantityKg} KG · {job.status}</Text>
      <Text style={ui.muted}>{job.pickup ?? 'Pickup unavailable'} → {job.delivery ?? 'Delivery unavailable'}</Text><Text style={ui.muted}>Fee: {money(job.fee)} · {job.feeStatus.replaceAll('_', ' ')}</Text><Badge>{job.status.replaceAll('_', ' ')}</Badge>
      {assigned && ['fee_proposed', 'fee_accepted'].includes(job.status) && <Text style={ui.muted}>Waiting for the buyer to {job.status === 'fee_proposed' ? 'review your fee' : 'pay the logistics advance'}.</Text>}
      {assigned && ['delivered', 'completed'].includes(job.status) && <Text style={ui.muted}>Delivery confirmed. {job.status === 'completed' ? 'This job is complete.' : 'Final balances are pending.'}</Text>}
      {job.status === 'available' && <Button primary title="Claim Job" disabled={action.pending} onPress={() => void action.run(() => mutations.claimLogisticsJob(job.id, options))} />}
      {assigned && ['claimed', 'fee_rejected'].includes(job.status) && <><Field label="Proposed fee (₹)" value={fee} onChange={setFee} numeric />
        <Button primary title="Propose Logistics Fee" disabled={action.pending || !Number.isFinite(Number(fee)) || Number(fee) <= 0} onPress={() => void action.run(() => mutations.proposeLogisticsFee(job.id, { fee: Number(fee) }, options))} /></>}
      {assigned && job.status === 'advance_paid' && <Button primary title="Confirm Pickup" disabled={action.pending} onPress={() => void action.run(() => mutations.confirmPickup(job.id, options))} />}
      {assigned && ['pickup_confirmed', 'in_transit'].includes(job.status) && <>
        <Button title="Send actual device location" disabled={action.pending} onPress={() => void action.run(actualLocation)} />
        {__DEV__ && <Button title={showSimulation ? 'Hide development controls' : 'Development only: simulated tracking'} onPress={() => setShowSimulation(!showSimulation)} />}{__DEV__ && showSimulation && <Card title="DEVELOPMENT ONLY · Simulated tracking"><Field label="Simulated latitude" value={latitude} onChange={setLatitude} numeric /><Field label="Simulated longitude" value={longitude} onChange={setLongitude} numeric />
          <Button title="Send simulated location" disabled={action.pending || !latitude.trim() || !longitude.trim() || !Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude)) || Math.abs(Number(latitude)) > 90 || Math.abs(Number(longitude)) > 180}
            onPress={() => void action.run(() => mutations.updateTracking(job.id, { latitude: Number(latitude), longitude: Number(longitude), source: 'simulated' }, options))} /></Card>}
      </>}
      {assigned && order?.status === 'delivery_otp_pending' && <><Field label="Buyer Delivery OTP (6 digits)" value={otp} onChange={value => setOtp(value.replace(/\D/g, '').slice(0, 6))} numeric secure />
        <Button primary title="Verify Delivery OTP" disabled={action.pending || !/^\d{6}$/.test(otp)} onPress={() => { setOtpMessage(null); void action.run(() => mutations.verifyDeliveryOtp(job.orderId, { otp }, options), () => { setOtp(''); setOtpMessage('Delivery confirmed. Final balances pending.'); }, error => {
          if (error instanceof ApiError && (error.code === 'INVALID_OTP' || error.code === 'OTP_ATTEMPTS_EXCEEDED')) {
            const attemptsRemaining = typeof error.details?.attemptsRemaining === 'number' ? error.details.attemptsRemaining : 0;
            setOtpMessage(attemptsRemaining > 0 ? `Incorrect delivery OTP. ${attemptsRemaining} attempts remaining.` : 'Too many incorrect attempts. Ask the buyer to generate a new delivery OTP.');
          }
        }); }} />
        <Text style={ui.muted}>Successful OTP verification confirms delivery. There is no additional confirmation step.</Text></>}
      {assigned && <Button title="View Order / Feedback" onPress={() => navigation.navigate('Order', { orderId: job.orderId })} />}
    </Card>{order && <><ProfileCard profile={state.data?.profiles.find(p => p.id === order.farmerId)} /><ProfileCard profile={state.data?.profiles.find(p => p.id === order.buyerId)} /></>}</> : state.data && <Text style={ui.muted}>This job is no longer available to this account. Refresh Jobs.</Text>}
  </Page>;
}
