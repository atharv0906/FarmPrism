import { validListing, marketSourceLabel } from '../../services/api/trading.validation';
import { useCallback, useState } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TradingRoutes } from '../../navigation/TradingRoutes';
import { useTrading } from '../../hooks/useTrading';
import { useTradingAction } from '../../hooks/useTradingAction';
import { useAuth } from '../../hooks/useAuth';
import { useRemote } from '../../hooks/useRemote';
import { marketplaceMutations as mutations } from '../../services/api/mutation.client';
import { tradingClient } from '../../services/api/trading.client';
import { Button, Card, Field, Page, money, date } from '../../components/trading/TradingUI';
import { ProfileCard } from './SharedScreens';
import { MarketDetailsBody } from './MarketScreens';

type Props<K extends keyof TradingRoutes> = NativeStackScreenProps<TradingRoutes, K>;
const active = (status: string) => ['open', 'active', 'partially_sold'].includes(status);

export function SellHomeScreen({ navigation }: Props<'SellHome'>) {
  const state = useTrading(), data = state.data;
  const items = data?.items.filter(i => active(i.status)) ?? [];
  return <Page title="Sell Produce" {...state} retry={() => void state.refresh()}>
    {data && <>
      <Card title="Your selling activity"><Text>Active Auctions: {items.filter(i => i.kind === 'auction').length}</Text>
        <Text>Active Fixed Listings: {items.filter(i => i.kind === 'fixed').length}</Text>
        <Text>Buyer Offers: {data.offers.filter(o => o.kind === 'auction' && ['active', 'partially_accepted'].includes(o.status)).length}</Text>
        <Text>Purchase Requests: {data.offers.filter(o => o.kind === 'fixed' && ['pending', 'partially_accepted'].includes(o.status)).length}</Text></Card>
      <Button title="Sell Produce" onPress={() => navigation.navigate('SelectBatch')} />
      <Button title="Buyer Offers" onPress={() => navigation.navigate('Offers', { kind: 'auction' })} />
      <Button title="Purchase Requests" onPress={() => navigation.navigate('Offers', { kind: 'fixed' })} />
      <Button title="Selling History" onPress={() => navigation.navigate('History')} /><Button title="My Orders" onPress={() => navigation.navigate('Orders')} />
      {!items.length && <Card><Text>No active listings. Select an available batch to start selling.</Text></Card>}
      {items.map(i => <Card key={i.id} title={i.batch.crop + ' · ' + (i.kind === 'auction' ? 'Auction' : 'Fixed Price')}>
        <Text>{i.remainingKg} KG · {money(i.pricePerKg)}/KG · {i.status}</Text><Button title="View Details" onPress={() => navigation.navigate('Item', { itemId: i.id })} />
      </Card>)}
    </>}
  </Page>;
}
export function SelectBatchScreen({ navigation }: Props<'SelectBatch'>) {
  const state = useTrading();
  const batches = state.data?.batches.filter(b => b.status === 'available' && b.quantityKg > 0 && !state.data?.items.some(i => i.batch.id === b.id && active(i.status))) ?? [];
  return <Page title="Select Batch" {...state} retry={() => void state.refresh()}>
    {state.data && !batches.length && <Text>No available unlisted batches. Review your active listings or My Farm.</Text>}
    {batches.map(b => <Card key={b.id} title={b.crop + ' · ' + b.code}><Text>{b.quantityKg} KG available · {b.status}</Text>
      <Text>Farmer Declared grade: {b.grade ?? 'Not declared'}</Text><Button title="Select Batch" onPress={() => navigation.navigate('Quality', { batchId: b.id })} /></Card>)}
  </Page>;
}
export function QualityScreen({ route, navigation }: Props<'Quality'>) {
  const state = useTrading(), batch = state.data?.batches.find(b => b.id === route.params.batchId);
  return <Page title="Farmer Declared Quality" {...state} retry={() => void state.refresh()}>
    {batch ? <Card title={batch.crop + ' · ' + batch.code}><Text>Current grade: {batch.grade ?? 'Not declared'}</Text>
      <Text>Grades A, B and C are farmer declarations. Grade editing is unavailable in the current backend.</Text>
      {batch.grade ? <Button title="Continue to Market / Price Insight" onPress={() => navigation.navigate('PriceInsight', { batchId: batch.id })} /> : <Text>This batch needs a persisted grade before publishing. Please choose another graded batch.</Text>}
    </Card> : state.data && <Text>Batch unavailable.</Text>}
  </Page>;
}
export function PriceInsightScreen({ route, navigation }: Props<'PriceInsight'>) {
  const state = useRemote(useCallback(() => tradingClient.insight(route.params.batchId), [route.params.batchId]));
  const data = state.data;
  return <Page title="Price Insight" {...state} retry={() => void state.refresh()}>
    {data && <>
      <Card title={data.recommendation.mode === 'ai_assisted' ? 'AI-assisted market recommendation' : 'Market-based recommendation'}>
        <Text>{data.crop} · Farmer Declared Grade {data.quality.grade ?? 'Not declared'}</Text>
        <Text>{marketSourceLabel(data.market.isDemo, data.market.source)}</Text>
        <Text>Observed: {date(data.market.observedAt)}</Text><Text>Source: {data.market.source}</Text>
        <Text>Current modal: {money(data.market.latestModalPricePerKg)}/KG</Text>
        <Text>Min {money(data.market.minPricePerKg)} · Max {money(data.market.maxPricePerKg)}/KG</Text>
        <Text>Next 7 days: {money(data.recommendation.suggestedMinPricePerKg)}–{money(data.recommendation.suggestedMaxPricePerKg)}/KG</Text>
        <Text>Suggested reserve/fixed price: {money(data.recommendation.suggestedReservePricePerKg)}/KG</Text>
        <Text>Confidence: {data.recommendation.confidence}</Text><Text>{data.recommendation.reasoning}</Text>
      </Card>
      <Button title="Choose Selling Method" onPress={() => navigation.navigate('ChooseMethod', { batchId: route.params.batchId, suggestedPrice: data.recommendation.suggestedReservePricePerKg })} />
      <MarketDetailsBody crop={data.crop} />
    </>}
    {state.error && <Button title="Continue with my own selling price" onPress={() => navigation.navigate('ChooseMethod', { batchId: route.params.batchId })} />}
  </Page>;
}
export function ChooseMethodScreen({ route, navigation }: Props<'ChooseMethod'>) {
  return <Page title="Choose Selling Method">
    <Card title="Auction"><Text>Let buyers compete with bids</Text><Button title="Choose Auction" onPress={() => navigation.navigate('CreateListing', { ...route.params, kind: 'auction' })} /></Card>
    <Card title="Fixed Price"><Text>Set the price you want</Text><Button title="Choose Fixed Price" onPress={() => navigation.navigate('CreateListing', { ...route.params, kind: 'fixed' })} /></Card>
  </Page>;
}
export function CreateListingScreen({ route, navigation }: Props<'CreateListing'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  const [quantity, setQuantity] = useState(''), [price, setPrice] = useState(route.params.suggestedPrice?.toString() ?? '');
  const [duration, setDuration] = useState<6 | 12 | 24>(24);
  const batch = state.data?.batches.find(b => b.id === route.params.batchId);
  const q = Number(quantity), p = Number(price), isAuction = route.params.kind === 'auction';
  const valid = !!batch && validListing(q, batch.quantityKg, p);
  function submit() {
    if (!valid || !demoApiToken) return;
    const options = { bearerToken: demoApiToken };
    if (isAuction) void action.run(() => mutations.createAuction({ batchId: route.params.batchId, quantityKg: q, reservePricePerKg: p, durationHours: duration }, options), r => navigation.replace('Item', { itemId: r.data.auctionId }));
    else void action.run(() => mutations.createFixedListing({ batchId: route.params.batchId, quantityKg: q, fixedPricePerKg: p }, options), r => navigation.replace('Item', { itemId: r.data.listingId }));
  }
  return <Page title={isAuction ? 'Create Auction' : 'Create Fixed Price'} loading={state.loading} error={action.error ?? state.error} retry={() => void state.refresh()}>
    {batch && <Card title={batch.crop + ' · ' + batch.code}><Text>Available: {batch.quantityKg} KG</Text>
      <Field label="Quantity (KG)" value={quantity} onChange={setQuantity} numeric /><Field label={isAuction ? 'Reserve price (₹/KG)' : 'Fixed price (₹/KG)'} value={price} onChange={setPrice} numeric />
      {isAuction ? ([6, 12, 24] as const).map(d => <Button key={d} title={(duration === d ? '✓ ' : '') + d + 'h'} onPress={() => setDuration(d)} />) : <Text>Active until sold, closed or expired after 24 hours.</Text>}
      <Text>Use a positive quantity within the available batch and a positive price.</Text><Button title={action.pending ? 'Publishing…' : 'Publish'} disabled={!valid || action.pending || !demoApiToken} onPress={submit} />
    </Card>}
  </Page>;
}
export function ItemScreen({ route, navigation }: Props<'Item'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  const item = state.data?.items.find(i => i.id === route.params.itemId), role = state.data?.me.role;
  const offers = state.data?.offers.filter(o => o.itemId === item?.id && ['active', 'pending', 'partially_accepted'].includes(o.status)) ?? [];
  const valid = item && active(item.status) && Date.parse(item.endsAt) > Date.now();
  return <Page title={item?.kind === 'fixed' ? 'Fixed Listing Details' : 'Auction Details'} loading={state.loading} error={action.error ?? state.error} retry={() => void state.refresh()}>
    {item ? <><Card title={item.batch.crop + ' · ' + item.batch.code}><Text>Offered {item.offeredKg} KG · Remaining {item.remainingKg} KG</Text>
      <Text>{money(item.pricePerKg)}/KG · {item.status}</Text><Text>Farmer Declared Grade {item.batch.grade ?? 'Not declared'}</Text>
      <Text>Starts {date(item.startsAt)}</Text><Text>Ends {date(item.endsAt)}</Text>
      {role === 'farmer' && <Text>{offers.length} eligible offers/requests</Text>}
      {item.kind === 'auction' && <Text>Expiry does not award an auction. The farmer decides which eligible offers to accept.</Text>}
      {role === 'buyer' && valid && (item.kind === 'fixed' || item.status === 'open') && <Button title={item.kind === 'auction' ? 'Place / Revise Bid' : 'Request Purchase'} onPress={() => navigation.navigate('BidForm', { itemId: item.id })} />}
      {role === 'farmer' && <Button title={item.kind === 'auction' ? 'View Buyer Offers' : 'View Purchase Requests'} onPress={() => navigation.navigate('Offers', { itemId: item.id, kind: item.kind })} />}
      {role === 'farmer' && valid && <Button title="Close Early" disabled={action.pending} onPress={() => {
        if (!demoApiToken) return;
        void action.run<unknown>(() => item.kind === 'auction' ? mutations.closeAuction(item.id, { bearerToken: demoApiToken }) : mutations.closeFixedListing(item.id, { bearerToken: demoApiToken }));
      }} />}
    </Card><ProfileCard profile={state.data?.profiles.find(p => p.id === item.batch.farmerId)} /></> : state.data && <Text>This listing is unavailable. Refresh Market or Sell.</Text>}
  </Page>;
}
export function OffersScreen({ route, navigation }: Props<'Offers'>) {
  const state = useTrading();
  const offers = state.data?.offers.filter(o => (!route.params?.kind || o.kind === route.params.kind) && (!route.params?.itemId || o.itemId === route.params.itemId) && ['active', 'pending', 'partially_accepted'].includes(o.status)).sort((a, b) => b.pricePerKg - a.pricePerKg) ?? [];
  return <Page title={route.params?.kind === 'fixed' ? 'Purchase Requests' : 'Buyer Offers'} {...state} retry={() => void state.refresh()}>
    <Text>The farmer may choose any eligible offer. Highest price is not automatically accepted.</Text>
    {state.data && !offers.length && <Text>No eligible offers or requests yet.</Text>}
    {offers.map(o => <Card key={o.id} title={state.data?.profiles.find(p => p.id === o.buyerId)?.name}>
      <Text>Trust Score: {state.data?.profiles.find(p => p.id === o.buyerId)?.trustScore ?? 'Unavailable'}</Text>
      <Text>{money(o.pricePerKg)}/KG · {o.remainingKg} KG remaining · {o.advancePercent}% advance</Text><Text>{o.status} · {date(o.updatedAt)}</Text>
      <Button title="Offer Details" onPress={() => navigation.navigate('Offer', { offerId: o.id })} />
    </Card>)}
  </Page>;
}
export function OfferScreen({ route, navigation }: Props<'Offer'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth(), [quantity, setQuantity] = useState('');
  const offer = state.data?.offers.find(o => o.id === route.params.offerId), item = state.data?.items.find(i => i.id === offer?.itemId);
  const limit = offer && item ? Math.min(offer.remainingKg, item.remainingKg, item.batch.quantityKg) : 0;
  const q = Number(quantity);
  return <Page title="Offer Details" loading={state.loading} error={action.error ?? state.error} retry={() => void state.refresh()}>
    {offer && <><ProfileCard profile={state.data?.profiles.find(p => p.id === offer.buyerId)} /><Card title={offer.kind === 'fixed' ? 'Fixed-price request' : 'Auction bid'}>
      <Text>{money(offer.pricePerKg)}/KG · Requested {offer.quantityKg} KG · Remaining {offer.remainingKg} KG</Text><Text>Advance: {offer.advancePercent}%</Text>
      <Text>Delivery: {offer.delivery ?? 'Unavailable'}</Text><Text>{offer.status} · {date(offer.createdAt)}</Text>
      <Field label={'Accept quantity (KG), maximum ' + limit} numeric value={quantity} onChange={setQuantity} />
      <Button title="Use full remaining quantity" onPress={() => setQuantity(String(limit))} />
      <Button title={action.pending ? 'Accepting…' : 'Accept Offer'} disabled={action.pending || !Number.isFinite(q) || q <= 0 || q > limit || !['active', 'pending', 'partially_accepted'].includes(offer.status)} onPress={() => {
        if (!demoApiToken) return;
        void action.run(() => offer.kind === 'auction' ? mutations.acceptBid(offer.id, { quantityKg: q }, { bearerToken: demoApiToken }) : mutations.acceptPurchaseRequest(offer.id, { quantityKg: q }, { bearerToken: demoApiToken }), result => navigation.navigate('Order', { orderId: result.data.orderId }));
      }} />
      <Text>Rejection is not supported by the current backend. Accepting creates an order atomically.</Text>
    </Card></>}
  </Page>;
}
