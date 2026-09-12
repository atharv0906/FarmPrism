import { dashboardAssets as d } from '../../components/farmer-dashboard/dashboardAssets';
import { useState, type PropsWithChildren } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TradingRoutes } from '../../navigation/TradingRoutes';
import type { Profile } from '../../services/api/trading.types';
import { useTrading } from '../../hooks/useTrading';
import { useTradingAction } from '../../hooks/useTradingAction';
import { marketplaceMutations as mutations } from '../../services/api/mutation.client';
import { tradingClient } from '../../services/api/trading.client';
import { Page, Card, Button, Field, money, date, Badge, Metric, SelectChip, cropArtwork, ui } from '../../components/farmprism-shell/RoleUI';
import { FarmerPage } from '../../components/farmer-sell/FarmerSellUI';
import { useAuth } from '../../hooks/useAuth';

const TradingPage = Page;
type Props<K extends keyof TradingRoutes> = NativeStackScreenProps<TradingRoutes, K>;
export function ProfileCard({ profile }: { profile?: Profile }) {
  if (!profile) return <Card><Text style={ui.muted}>Profile not available.</Text></Card>;
  const reliability = profile.role === 'farmer' ? profile.qualityConsistency : profile.role === 'buyer' ? profile.paymentReliability : profile.deliveryReliability;
  const label = profile.role === 'farmer' ? 'Quality consistency' : profile.role === 'buyer' ? 'Payment reliability' : 'Delivery reliability';
  return <Card title={profile.name}><View style={ui.listingMeta}><Badge>{profile.role.toUpperCase()}</Badge><Badge>{profile.verification?.replaceAll('_', ' ') ?? 'Verification not available'}</Badge></View>
    <View style={ui.metricRow}><Metric value={profile.trustScore == null ? 'Not available' : profile.trustScore + '/100'} label="Trust Score" icon={d.opportunity} /><Metric value={profile.completedTransactions ?? 'Not available'} label="Completed transactions" icon={d.orders} /></View>
    <Text style={ui.muted}>{label}: {reliability ?? 'Not available'}</Text>
    {profile.location && <Text style={ui.muted}>{profile.location}</Text>}
    {profile.role === 'farmer' && <Text style={ui.muted}>Farm area: {profile.area == null ? 'Not available' : profile.area + ' acres'}</Text>}
    {profile.role === 'logistics' && <Text style={ui.muted}>Vehicle: {profile.vehicle ?? 'Not available'} · Capacity: {profile.capacity == null ? 'Not available' : profile.capacity + ' KG'}</Text>}
  </Card>;
}
export function ProfileScreen({ route }: Props<'Profile'>) {
  const state = useTrading(), { logout } = useAuth(), [error, setError] = useState<string | null>(null);
  const profile = route.params?.accountId ? state.data?.profiles.find(p => p.id === route.params?.accountId) : state.data?.me;
  return <TradingPage title="Profile" hasData={!!state.data} loading={state.loading} error={state.error} mutationError={error} retry={() => void state.refresh()}>
    {state.data && <ProfileCard profile={profile} />}
    {!route.params?.accountId && <><Button title="Sign out" onPress={() => void logout().catch(e => setError(e instanceof Error ? e.message : 'Unable to sign out.'))} /></>}
  </TradingPage>;
}
export function OrdersScreen({ navigation, route }: Props<'Orders'> | Props<'History'>) {
  const state = useTrading(), [filter, setFilter] = useState<'all' | 'auction' | 'fixed' | 'completed'>('all');
  const history = route.name === 'History';
  const orders = state.data?.orders.filter(o => filter === 'all' || o.kind === filter || (filter === 'completed' && o.status === 'completed')) ?? [];
  return <TradingPage title={history ? 'Selling History' : 'Orders'} hasData={!!state.data} loading={state.loading} error={state.error} retry={() => void state.refresh()}>
    <View style={[ui.toggleRow, { flexWrap: 'wrap' }]}>{(['all', 'auction', 'fixed', 'completed'] as const).map(f => <SelectChip key={f} label={f === 'fixed' ? 'Fixed Price' : f[0].toUpperCase() + f.slice(1)} selected={filter === f} onPress={() => setFilter(f)} />)}</View>
    {state.data && !orders.length && <Text style={ui.muted}>No orders in this view yet.</Text>}
    {orders.map(o => <Card key={o.id} title={o.code + ' · ' + o.batch.crop}>
      <Text style={ui.muted}>{o.kind === 'auction' ? 'Auction' : 'Fixed Price'} · {o.quantityKg} KG · {money(o.total)}</Text>
      <Text style={ui.muted}>Buyer: {state.data?.profiles.find(p => p.id === o.buyerId)?.name ?? 'Unavailable'}</Text><Badge>{o.status.replaceAll('_', ' ')}</Badge><Text style={ui.muted}>{date(o.createdAt)}</Text>
      <Button title="View Order" onPress={() => navigation.navigate('Order', { orderId: o.id })} />
    </Card>)}
    {history && state.data?.items.filter(i => !['open', 'active', 'partially_sold'].includes(i.status)).map(i => <Card key={i.id} title={i.batch.crop + ' · ' + i.status}>
      <Text style={ui.muted}>{i.kind} · {i.offeredKg} KG offered · {i.remainingKg} KG remaining</Text><Button title="View Listing" onPress={() => navigation.navigate('Item', { itemId: i.id })} />
    </Card>)}
  </TradingPage>;
}
export function OrderScreen({ route, navigation }: Props<'Order'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  const [otp, setOtp] = useState<{ value: string; expiresAt: string } | null>(null), [rating, setRating] = useState('5'), [comment, setComment] = useState(''), [to, setTo] = useState('');
  const data = state.data, order = data?.orders.find(o => o.id === route.params.orderId), job = data?.jobs.find(j => j.orderId === order?.id);
  const options = { bearerToken: demoApiToken ?? '' }, buyer = data?.me.role === 'buyer', logistics = data?.me.role === 'logistics';
  const participants = data?.profiles.filter(p => p.id !== data.me.id && [order?.farmerId, order?.buyerId, job?.logisticsId].includes(p.id)) ?? [];
  return <TradingPage title={order?.code ?? 'Order Details'} hasData={!!state.data} loading={state.loading} error={state.error} mutationError={action.error} retry={() => void state.refresh()}>
    {order ? <>
      <Card title={order.batch.crop + ' · ' + order.batch.code}><Text style={ui.muted}>{order.quantityKg} KG · {money(order.pricePerKg)}/KG · Total {money(order.total)}</Text>
        <Text style={ui.muted}>Farmer advance: {order.advancePercent}% · {order.status}</Text><Text style={ui.muted}>Logistics: {job?.status ?? 'Not assigned'}</Text>
        <Text style={ui.muted}>Logistics fee: {money(job?.fee)} · {job?.feeStatus ?? 'No proposal'}</Text>
        <Badge>{order.status.replaceAll('_', ' ')}</Badge>
        {buyer && order.status === 'farmer_advance_pending' && <Button title="Pay simulated Farmer advance" disabled={action.pending} onPress={() => action.pay(() => mutations.payFarmerAdvance(order.id, options))} />}
        {buyer && job?.feeStatus === 'proposed' && <><Button title="Accept logistics fee" disabled={action.pending} onPress={() => void action.run(() => mutations.respondLogisticsFee(job.id, { accept: true }, options))} />
          <Button title="Reject logistics fee" disabled={action.pending} onPress={() => void action.run(() => mutations.respondLogisticsFee(job.id, { accept: false }, options))} /></>}
        {buyer && order.status === 'logistics_advance_pending' && <Button title="Pay simulated 40% logistics advance" disabled={action.pending} onPress={() => action.pay(() => mutations.payLogisticsAdvance(order.id, options))} />}
        {buyer && ['in_transit', 'delivery_otp_pending'].includes(order.status) && <Button title="Generate Delivery OTP" disabled={action.pending} onPress={() => { setOtp(null); void action.run(() => mutations.generateDeliveryOtp(order.id, options), r => setOtp({ value: r.data.otp, expiresAt: r.data.expiresAt })); }} />}
        {buyer && otp && order.status === 'delivery_otp_pending' && <Text selectable>Delivery OTP: {Date.parse(otp.expiresAt) > Date.now() ? otp.value : 'Expired'} · expires {date(otp.expiresAt)}. Share with your logistics partner at delivery.</Text>}
        {buyer && order.status === 'balance_pending' && <Button title="Pay simulated final Farmer + 60% logistics balances" disabled={action.pending} onPress={() => action.pay(() => mutations.payFinalBalances(order.id, options))} />}
        {logistics && job && <Button title="Open Logistics Job" onPress={() => navigation.navigate('Job', { jobId: job.id })} />}
      </Card>
      {participants.map(p => <ProfileCard key={p.id} profile={p} />)}
      <Card title="Payments">{!data?.payments.some(p => p.orderId === order.id) && <Text style={ui.muted}>No payment records yet.</Text>}
        {data?.payments.filter(p => p.orderId === order.id).map(p => <Text key={p.id}>{p.kind}: {money(p.amount)} · {p.status} · {p.simulated ? 'Simulated' : 'Recorded payment'} · {date(p.paidAt)}</Text>)}</Card>
      <Card title="Tracking">{!data?.tracking.some(p => p.jobId === job?.id) && <Text style={ui.muted}>No tracking points yet.</Text>}
        {data?.tracking.filter(p => p.jobId === job?.id).slice(0, 10).map(p => <Text key={p.id}>{p.source === 'simulated' ? 'Simulated tracking · development only' : 'Actual device location received'} · {date(p.recordedAt)}</Text>)}</Card>
      <Card title="Timeline">{data?.events.filter(e => e.orderId === order.id).map(e => <View key={e.id} style={ui.separator}><Badge>{e.type.replaceAll('_', ' ')}</Badge><Text style={ui.muted}>{date(e.createdAt)}</Text></View>)}</Card>
      {order.status === 'completed' && <Card title="Transaction feedback">{participants.map(p => <Button key={p.id} title={(to === p.id ? '✓ ' : '') + p.name} onPress={() => setTo(p.id)} />)}
        <Field label="Rating (1–5)" value={rating} onChange={setRating} numeric /><Field label="Comment" value={comment} onChange={setComment} />
        <Button title="Submit feedback" disabled={action.pending || !to || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5} onPress={() => void action.run(() => mutations.submitFeedback(order.id, { toAccountId: to, rating: Number(rating), comment }, options))} />
        <Text style={ui.muted}>Your feedback helps build trust in the marketplace.</Text></Card>}
    </> : data && <Text style={ui.muted}>Order is unavailable for this account.</Text>}
  </TradingPage>;
}
export function TradingNotificationsScreen({ navigation }: Props<'Notifications'>) {
  const state = useTrading(), action = useTradingAction(state.refresh);
  return <TradingPage title="Notifications" hasData={!!state.data} loading={state.loading} error={state.error} mutationError={action.error} retry={() => void state.refresh()}>
    {state.data && !state.data.notifications.length && <Text style={ui.muted}>No notifications yet.</Text>}
    {state.data?.notifications.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.title} disabled={action.pending} onPress={() => void action.run(() => tradingClient.markRead(item.id), () => {
        const data = state.data!;
        const orderId = item.orderId ?? (item.entityType === 'order' ? item.entityKey : null);
        const jobId = item.jobId ?? (item.entityType === 'job' ? item.entityKey : null);
        if (orderId) navigation.navigate('Order', { orderId });
        else if (jobId && data.me.role === 'logistics') navigation.navigate('Job', { jobId });
        else if (['auction', 'fixed_listing'].includes(item.entityType ?? '') && item.entityKey) navigation.navigate('Item', { itemId: item.entityKey });
        else if (['bid', 'purchase_request'].includes(item.entityType ?? '') && item.entityKey && data.me.role === 'farmer') navigation.navigate('Offer', { offerId: item.entityKey });
        else navigation.navigate(data.me.role === 'farmer' ? 'SellHome' : data.me.role === 'buyer' ? 'BuyerHome' : 'LogisticsHome');
      })}><Card title={item.title}><View style={ui.listingMeta}><Badge>{item.readAt ? 'Read' : 'New'}</Badge><Text style={ui.muted}>{date(item.createdAt)}</Text></View><Text style={ui.muted}>{item.body}</Text><Text style={ui.buttonOutlineText}>View update ›</Text></Card></Pressable>)}
  </TradingPage>;
}
