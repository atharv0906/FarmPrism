import { useState, type PropsWithChildren } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TradingRoutes } from '../../navigation/TradingRoutes';
import type { Profile } from '../../services/api/trading.types';
import { useTrading } from '../../hooks/useTrading';
import { useTradingAction } from '../../hooks/useTradingAction';
import { marketplaceMutations as mutations } from '../../services/api/mutation.client';
import { tradingClient } from '../../services/api/trading.client';
import { Page, Card, Button, Field, money, date } from '../../components/trading/TradingUI';
import { FarmerPage } from '../../components/farmer-sell/FarmerSellUI';
import { useAuth } from '../../hooks/useAuth';

function TradingPage({ title, children, loading, error, retry }: PropsWithChildren<{ title: string; loading?: boolean; error?: string | null; retry?: () => void }>) {
  const { demoAccount } = useAuth();
  if (demoAccount?.role === 'farmer') return <FarmerPage title={title} back={title !== 'Profile'} selectedTab={title === 'Profile' ? 'Profile' : 'Sell'} loading={loading} error={error} retry={retry}>{children}</FarmerPage>;
  return <Page title={title} loading={loading} error={error} retry={retry}>{children}</Page>;
}
type Props<K extends keyof TradingRoutes> = NativeStackScreenProps<TradingRoutes, K>;
export function ProfileCard({ profile }: { profile?: Profile }) {
  if (!profile) return <Card><Text>Profile unavailable.</Text></Card>;
  return <Card title={profile.name}><Text>{profile.role} · {profile.verification ?? 'Verification unavailable'}</Text>
    <Text>Trust Score: {profile.trustScore ?? 'Unavailable'}/100</Text><Text>Completed transactions: {profile.completedTransactions ?? 'Unavailable'}</Text>
    {profile.qualityConsistency !== null && <Text>Quality consistency: {profile.qualityConsistency}</Text>}
    {profile.paymentReliability !== null && <Text>Payment reliability: {profile.paymentReliability}</Text>}
    {profile.deliveryReliability !== null && <Text>Delivery reliability: {profile.deliveryReliability}</Text>}
    {profile.location && <Text>{profile.location}</Text>}{profile.area !== null && <Text>Farm area: {profile.area} acres</Text>}
    {profile.farmerCode && <Text>Farmer ID: {profile.farmerCode}</Text>}{profile.vehicle && <Text>Vehicle: {profile.vehicle}</Text>}
    {profile.capacity !== null && <Text>Capacity: {profile.capacity} KG</Text>}
  </Card>;
}
export function ProfileScreen({ route }: Props<'Profile'>) {
  const state = useTrading(), { logout } = useAuth(), [error, setError] = useState<string | null>(null);
  const profile = route.params?.accountId ? state.data?.profiles.find(p => p.id === route.params?.accountId) : state.data?.me;
  return <TradingPage title="Profile" loading={state.loading} error={error ?? state.error} retry={() => void state.refresh()}>
    {state.data && <ProfileCard profile={profile} />}
    {!route.params?.accountId && <><Text>Profile editing is not available through the current API.</Text><Button title="Sign out" onPress={() => void logout().catch(e => setError(e instanceof Error ? e.message : 'Unable to sign out.'))} /></>}
  </TradingPage>;
}
export function OrdersScreen({ navigation, route }: Props<'Orders'> | Props<'History'>) {
  const state = useTrading(), [filter, setFilter] = useState<'all' | 'auction' | 'fixed' | 'completed'>('all');
  const history = route.name === 'History';
  const orders = state.data?.orders.filter(o => filter === 'all' || o.kind === filter || (filter === 'completed' && o.status === 'completed')) ?? [];
  return <TradingPage title={history ? 'Selling History' : 'Orders'} loading={state.loading} error={state.error} retry={() => void state.refresh()}>
    {(['all', 'auction', 'fixed', 'completed'] as const).map(f => <Button key={f} title={(filter === f ? '✓ ' : '') + f} onPress={() => setFilter(f)} />)}
    {state.data && !orders.length && <Text>No orders in this view yet.</Text>}
    {orders.map(o => <Card key={o.id} title={o.code + ' · ' + o.batch.crop}>
      <Text>{o.kind === 'auction' ? 'Auction' : 'Fixed Price'} · {o.quantityKg} KG · {money(o.total)}</Text>
      <Text>Buyer: {state.data?.profiles.find(p => p.id === o.buyerId)?.name ?? 'Unavailable'}</Text><Text>{o.status} · {date(o.createdAt)}</Text>
      <Button title="View Order" onPress={() => navigation.navigate('Order', { orderId: o.id })} />
    </Card>)}
    {history && state.data?.items.filter(i => !['open', 'active', 'partially_sold'].includes(i.status)).map(i => <Card key={i.id} title={i.batch.crop + ' · ' + i.status}>
      <Text>{i.kind} · {i.offeredKg} KG offered · {i.remainingKg} KG remaining</Text><Button title="View Listing" onPress={() => navigation.navigate('Item', { itemId: i.id })} />
    </Card>)}
  </TradingPage>;
}
export function OrderScreen({ route, navigation }: Props<'Order'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  const [otp, setOtp] = useState<{ value: string; expiresAt: string } | null>(null), [rating, setRating] = useState('5'), [comment, setComment] = useState(''), [to, setTo] = useState('');
  const data = state.data, order = data?.orders.find(o => o.id === route.params.orderId), job = data?.jobs.find(j => j.orderId === order?.id);
  const options = { bearerToken: demoApiToken ?? '' }, buyer = data?.me.role === 'buyer', logistics = data?.me.role === 'logistics';
  const participants = data?.profiles.filter(p => p.id !== data.me.id && [order?.farmerId, order?.buyerId, job?.logisticsId].includes(p.id)) ?? [];
  return <TradingPage title={order?.code ?? 'Order Details'} loading={state.loading} error={action.error ?? state.error} retry={() => void state.refresh()}>
    {order ? <>
      <Card title={order.batch.crop + ' · ' + order.batch.code}><Text>{order.quantityKg} KG · {money(order.pricePerKg)}/KG · Total {money(order.total)}</Text>
        <Text>Farmer advance: {order.advancePercent}% · {order.status}</Text><Text>Logistics: {job?.status ?? 'Not assigned'}</Text>
        <Text>Logistics fee: {money(job?.fee)} · {job?.feeStatus ?? 'No proposal'}</Text>
        <Text>Payment amounts and state transitions are controlled by the backend.</Text>
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
      <Card title="Payments">{!data?.payments.some(p => p.orderId === order.id) && <Text>No payment records yet.</Text>}
        {data?.payments.filter(p => p.orderId === order.id).map(p => <Text key={p.id}>{p.kind}: {money(p.amount)} · {p.status} · {p.simulated ? 'Simulated' : 'Recorded payment'} · {date(p.paidAt)}</Text>)}</Card>
      <Card title="Tracking">{!data?.tracking.some(p => p.jobId === job?.id) && <Text>No tracking points yet.</Text>}
        {data?.tracking.filter(p => p.jobId === job?.id).slice(0, 10).map(p => <Text key={p.id}>{p.source === 'simulated' ? 'Simulated tracking' : 'Actual device location'}: {p.latitude}, {p.longitude} · {date(p.recordedAt)}</Text>)}</Card>
      <Card title="Timeline">{data?.events.filter(e => e.orderId === order.id).map(e => <Text key={e.id}>{e.type} · {date(e.createdAt)}</Text>)}</Card>
      {order.status === 'completed' && <Card title="Transaction feedback">{participants.map(p => <Button key={p.id} title={(to === p.id ? '✓ ' : '') + p.name} onPress={() => setTo(p.id)} />)}
        <Field label="Rating (1–5)" value={rating} onChange={setRating} numeric /><Field label="Comment" value={comment} onChange={setComment} />
        <Button title="Submit feedback" disabled={action.pending || !to || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5} onPress={() => void action.run(() => mutations.submitFeedback(order.id, { toAccountId: to, rating: Number(rating), comment }, options))} />
        <Text>Trust is recalculated by the backend.</Text></Card>}
    </> : data && <Text>Order is unavailable for this account.</Text>}
  </TradingPage>;
}
export function TradingNotificationsScreen({ navigation }: Props<'Notifications'>) {
  const state = useTrading(), action = useTradingAction(state.refresh);
  return <TradingPage title="Notifications" loading={state.loading} error={action.error ?? state.error} retry={() => void state.refresh()}>
    {state.data && !state.data.notifications.length && <Text>No notifications yet.</Text>}
    {state.data?.notifications.map(item => <Card key={item.id} title={item.title}><Text>{item.body}</Text><Text>{date(item.createdAt)} · {item.readAt ? 'Read' : 'Unread'}</Text>
      <Button title="Open" disabled={action.pending} onPress={() => void action.run(() => tradingClient.markRead(item.id), () => {
        const data = state.data!;
        const orderId = item.orderId ?? (item.entityType === 'order' ? item.entityKey : null);
        const jobId = item.jobId ?? (item.entityType === 'job' ? item.entityKey : null);
        if (orderId) navigation.navigate('Order', { orderId });
        else if (jobId && data.me.role === 'logistics') navigation.navigate('Job', { jobId });
        else if (['auction', 'fixed_listing'].includes(item.entityType ?? '') && item.entityKey) navigation.navigate('Item', { itemId: item.entityKey });
        else if (['bid', 'purchase_request'].includes(item.entityType ?? '') && item.entityKey && data.me.role === 'farmer') navigation.navigate('Offer', { offerId: item.entityKey });
        else navigation.navigate(data.me.role === 'farmer' ? 'SellHome' : data.me.role === 'buyer' ? 'BuyerHome' : 'LogisticsHome');
      })} />
    </Card>)}
  </TradingPage>;
}
