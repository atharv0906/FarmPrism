import { SelectChip } from '../../components/farmprism-shell/RoleUI';
import { validListing } from '../../services/api/trading.validation';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TradingRoutes } from '../../navigation/TradingRoutes';
import { useTrading } from '../../hooks/useTrading';
import { useTradingAction } from '../../hooks/useTradingAction';
import { useAuth } from '../../hooks/useAuth';
import { useRemote } from '../../hooks/useRemote';
import { marketplaceMutations as mutations } from '../../services/api/mutation.client';
import { tradingClient } from '../../services/api/trading.client';
import { ApiError } from '../../services/api/api.client';
import { FarmerPage, Card, SectionTitle, Metric, ActionTile, PrimaryAction, Badge, Button, Field, cropArtwork, quintals, sellAssets, ui } from '../../components/farmer-sell/FarmerSellUI';
import { ProfileCard } from './SharedScreens';
import { MarketDetailsBody } from './MarketScreens';
import { Page as TradingPage, Card as TradingCard, Button as TradingButton, money, date } from '../../components/farmprism-shell/RoleUI';

type Props<K extends keyof TradingRoutes> = NativeStackScreenProps<TradingRoutes, K>;
const active = (status: string) => ['open', 'active', 'partially_sold'].includes(status);

type TradingItem = NonNullable<ReturnType<typeof useTrading>['data']>['items'][number];
function ListingCard({ item, onPress }: { item: TradingItem; onPress: () => void }) {
  return <View style={ui.listingCard}><View style={ui.listingTop}><Image source={cropArtwork(item.batch.crop)} resizeMode="contain" style={ui.cropImage} /><View style={ui.listingCopy}><Text style={ui.cropTitle}>{item.batch.crop}</Text><Text style={ui.muted}>{item.kind === 'auction' ? 'Auction' : 'Fixed Price'} · {item.batch.code}</Text><Badge tone={item.kind === 'auction' ? 'green' : 'orange'}>{item.kind === 'auction' ? 'AUCTION' : 'FIXED PRICE'}</Badge></View></View><View style={ui.listingMeta}><Text style={ui.muted}>{quintals(item.remainingKg)} · {item.remainingKg} KG</Text><Text style={ui.muted}>{item.pricePerKg ? `₹${item.pricePerKg.toLocaleString('en-IN')}/KG` : 'Price unavailable'}</Text><Text style={ui.muted}>{item.status}</Text></View><Text style={ui.muted}>Farmer Declared Grade {item.batch.grade ?? 'Not declared'} · Ends {new Date(item.endsAt).toLocaleDateString()}</Text><Button title="View Details" onPress={onPress} outline /></View>;
}

export function SellHomeScreen({ navigation }: Props<'SellHome'>) {
  const state = useTrading(), data = state.data;
  const items = data?.items.filter(i => active(i.status)) ?? [];
  const auctions = items.filter(i => i.kind === 'auction').length;
  const fixed = items.filter(i => i.kind === 'fixed').length;
  const offers = data?.offers.filter(o => o.kind === 'auction' && ['active', 'partially_accepted'].includes(o.status)).length ?? 0;
  const requests = data?.offers.filter(o => o.kind === 'fixed' && ['pending', 'partially_accepted'].includes(o.status)).length ?? 0;
  return <FarmerPage title="Sell Produce" hero hasData={!!state.data} loading={state.loading} error={state.error} retry={() => void state.refresh()}>
    {data && <><Card><SectionTitle title="Selling Overview" /><View style={ui.metricRow}><Metric value={auctions} label="Active Auctions" icon={sellAssets.plus} /><Metric value={fixed} label="Fixed Listings" icon={sellAssets.plus} /><Metric value={offers} label="Buyer Offers" icon={sellAssets.plus} /><Metric value={requests} label="Purchase Requests" icon={sellAssets.plus} /></View></Card>
      <PrimaryAction onPress={() => navigation.navigate('SelectBatch')} />
      <Card><SectionTitle title="Manage Selling" /><View style={ui.actionGrid}><ActionTile title="Buyer Offers" detail="Review bids from buyers" icon={sellAssets.tomato} onPress={() => navigation.navigate('Offers', { kind: 'auction' })} /><ActionTile title="Purchase Requests" detail="Review fixed-price requests" icon={sellAssets.onion} onPress={() => navigation.navigate('Offers', { kind: 'fixed' })} /><ActionTile title="Selling History" detail="Past listings and orders" icon={sellAssets.potato} onPress={() => navigation.navigate('History')} /><ActionTile title="My Orders" detail="Track completed sales" icon={sellAssets.plus} onPress={() => navigation.navigate('Orders')} /></View></Card>
      <Card><SectionTitle title="Active Listings" />{!items.length ? <View style={ui.empty}><Image source={sellAssets.plus} resizeMode="contain" style={ui.emptyIcon} /><Text style={ui.emptyTitle}>No active listings yet</Text><Text style={ui.muted}>Select an available batch to start selling.</Text><Button title="Sell Produce" onPress={() => navigation.navigate('SelectBatch')} outline /></View> : items.map(item => <ListingCard key={item.id} item={item} onPress={() => navigation.navigate('Item', { itemId: item.id })} />)}</Card></>}
  </FarmerPage>;
}

export function SelectBatchScreen({ navigation }: Props<'SelectBatch'>) {
  const state = useTrading();
  const batches = state.data?.batches.filter(b => b.status === 'available' && b.quantityKg > 0 && !state.data?.items.some(i => i.batch.id === b.id && active(i.status))) ?? [];
  return <FarmerPage title="Select Batch" back hasData={!!state.data} loading={state.loading} error={state.error} retry={() => void state.refresh()}>{state.data && !batches.length && <View style={ui.empty}><Text style={ui.emptyTitle}>No available batches</Text><Text style={ui.muted}>Review your active listings or My Farm.</Text></View>}{batches.map(batch => <Card key={batch.id}><View style={ui.listingTop}><Image source={cropArtwork(batch.crop)} resizeMode="contain" style={ui.cropImage} /><View style={ui.listingCopy}><Text style={ui.cropTitle}>{batch.crop}</Text><Text style={ui.muted}>{batch.code}</Text><Badge>{batch.status}</Badge></View></View><Text style={ui.muted}>{quintals(batch.quantityKg)} · {batch.quantityKg} KG available</Text><Text style={ui.muted}>Farmer Declared Grade {batch.grade ?? 'Not declared'}</Text><Button title="Select Batch" onPress={() => navigation.navigate('Quality', { batchId: batch.id })} /></Card>)}</FarmerPage>;
}

export function QualityScreen({ route, navigation }: Props<'Quality'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  const batch = state.data?.batches.find(b => b.id === route.params.batchId);
  const [grade, setGrade] = useState<'A' | 'B' | 'C'>('A'), [notes, setNotes] = useState(''), [localError, setLocalError] = useState<string | null>(null);
  useEffect(() => { if (batch) { setGrade(batch.grade ?? 'A'); setNotes(batch.qualityNotes ?? ''); } }, [batch?.id, batch?.grade, batch?.qualityNotes]);
  function continueToInsight() { if (!batch || !demoApiToken) return; setLocalError(null); const notesValue = notes.trim() || null; const changed = batch.grade !== grade || (batch.qualityNotes ?? null) !== notesValue; if (!changed) { navigation.navigate('PriceInsight', { batchId: batch.id }); return; } void action.run(() => mutations.setBatchQuality(batch.id, { grade, notes: notesValue }, { bearerToken: demoApiToken }), () => navigation.navigate('PriceInsight', { batchId: batch.id }), error => { if (error instanceof ApiError && error.status === 409) setLocalError('This batch is already listed and its quality cannot be changed now. Your workspace has been refreshed.'); }); }
  return <FarmerPage title="Farmer Declared Quality" back hasData={!!state.data} loading={state.loading} error={state.error} mutationError={localError ?? action.error} retry={() => void state.refresh()}>{batch ? <Card><SectionTitle title={`${batch.crop} · ${batch.code}`} icon={cropArtwork(batch.crop)} /><Text style={ui.muted}>Choose the farmer-declared quality for this batch.</Text><View style={ui.toggleRow}>{(['A', 'B', 'C'] as const).map(value => <SelectChip key={value} label={`Grade ${value}`} selected={grade === value} onPress={() => setGrade(value)} />)}</View><Field label="Notes (optional)" value={notes} onChange={setNotes} /><Button title={action.pending ? 'Saving…' : 'Continue to Market / Price Insight'} disabled={action.pending || !demoApiToken} onPress={continueToInsight} /></Card> : state.data && <Text style={ui.muted}>Batch unavailable.</Text>}</FarmerPage>;
}

export function PriceInsightScreen({ route, navigation }: Props<'PriceInsight'>) {
  const state = useRemote(useCallback(() => tradingClient.insight(route.params.batchId), [route.params.batchId]));
  const data = state.data;
  const quintal = (pricePerKg: number | null | undefined) => pricePerKg == null ? 'Unavailable' : `₹${(pricePerKg * 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  return <FarmerPage title="Price Insight" back hasData={!!state.data} loading={state.loading} error={state.error} retry={() => void state.refresh()}>{data && <><Card><SectionTitle title="Price Insight" /><Text style={ui.cropTitle}>{data.crop} · Farmer Declared Grade {data.quality.grade ?? 'Not declared'}</Text><View style={ui.priceCard}><Text style={ui.small}>CURRENT MARKET PRICE</Text><Text style={ui.priceHero}>{quintal(data.market.latestModalPricePerKg)} / Quintal</Text><Text style={ui.muted}>₹{data.market.latestModalPricePerKg.toLocaleString('en-IN')}/KG</Text></View><View style={ui.priceRow}><View style={ui.priceMetric}><Text style={ui.small}>MARKET RANGE</Text><Text style={ui.priceMetricValue}>{quintal(data.market.minPricePerKg)}</Text><Text style={ui.muted}>Min / Quintal</Text></View><View style={ui.priceMetric}><Text style={ui.small}>MAXIMUM</Text><Text style={ui.priceMetricValue}>{quintal(data.market.maxPricePerKg)}</Text><Text style={ui.muted}>Max / Quintal</Text></View></View><View style={ui.suggested}><Text style={ui.small}>SUGGESTED SELLING PRICE</Text><Text style={ui.suggestedValue}>{quintal(data.recommendation.suggestedReservePricePerKg)} / Quintal</Text></View><View style={ui.nextDays}><Text style={ui.small}>NEXT 7 DAYS</Text><Text style={ui.nextDaysValue}>{quintal(data.recommendation.suggestedMinPricePerKg)} – {quintal(data.recommendation.suggestedMaxPricePerKg)} / Quintal</Text></View><Text style={ui.disclaimer}>Prices may vary with market demand and mandi conditions.</Text>{data.market.isDemo ? <Text style={ui.source}>Demo market data</Text> : <Text style={ui.source}>Market data: AGMARKNET</Text>}</Card><Button title="Choose Selling Method" onPress={() => navigation.navigate('ChooseMethod', { batchId: route.params.batchId, suggestedPrice: data.recommendation.suggestedReservePricePerKg })} /></>}{state.error && <Button title="Continue with my own selling price" onPress={() => navigation.navigate('ChooseMethod', { batchId: route.params.batchId })} outline />}</FarmerPage>;
}

export function ChooseMethodScreen({ route, navigation }: Props<'ChooseMethod'>) {
  return <FarmerPage title="Choose Selling Method" back>
    <ActionTile wide title="Auction" detail="Let buyers compete with bids" icon={sellAssets.tomato} onPress={() => navigation.navigate('CreateListing', { ...route.params, kind: 'auction' })} />
    <ActionTile wide title="Fixed Price" detail="Set the price you want" icon={sellAssets.onion} onPress={() => navigation.navigate('CreateListing', { ...route.params, kind: 'fixed' })} />
  </FarmerPage>;
}

export function CreateListingScreen({ route, navigation }: Props<'CreateListing'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  const [quantity, setQuantity] = useState(''), [price, setPrice] = useState(route.params.suggestedPrice?.toString() ?? ''), [duration, setDuration] = useState<6 | 12 | 24>(24);
  const batch = state.data?.batches.find(b => b.id === route.params.batchId), q = Number(quantity), p = Number(price), isAuction = route.params.kind === 'auction';
  const valid = !!batch && validListing(q, batch.quantityKg, p);
  function submit() { if (!valid || !demoApiToken) return; const options = { bearerToken: demoApiToken }; if (isAuction) void action.run(() => mutations.createAuction({ batchId: route.params.batchId, quantityKg: q, reservePricePerKg: p, durationHours: duration }, options), r => navigation.replace('Item', { itemId: r.data.auctionId })); else void action.run(() => mutations.createFixedListing({ batchId: route.params.batchId, quantityKg: q, fixedPricePerKg: p }, options), r => navigation.replace('Item', { itemId: r.data.listingId })); }
  return <FarmerPage title={isAuction ? 'Create Auction' : 'Create Fixed Price'} back hasData={!!state.data} loading={state.loading} error={state.error} mutationError={action.error} retry={() => void state.refresh()}>{batch && <Card><SectionTitle title={`${batch.crop} · ${batch.code}`} icon={cropArtwork(batch.crop)} /><Text style={ui.muted}>Available: {quintals(batch.quantityKg)} · {batch.quantityKg} KG</Text><Field label="Quantity (KG)" value={quantity} onChange={setQuantity} numeric /><Field label={isAuction ? 'Reserve price (₹/KG)' : 'Fixed price (₹/KG)'} value={price} onChange={setPrice} numeric />{isAuction && <><Text style={ui.fieldLabel}>Auction duration</Text><View style={ui.toggleRow}>{([6, 12, 24] as const).map(d => <PressDuration key={d} selected={duration === d} label={`${d} Hours`} onPress={() => setDuration(d)} />)}</View></>}{!isAuction && <Text style={ui.muted}>Your fixed-price listing expires after 24 hours.</Text>}<Button title={action.pending ? 'Publishing…' : isAuction ? 'Publish Auction' : 'Publish Fixed Price'} disabled={!valid || action.pending || !demoApiToken} onPress={submit} /></Card>}</FarmerPage>;
}

function PressDuration({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) { return <SelectChip label={label} selected={selected} onPress={onPress} />; }

export function ItemScreen({ route, navigation }: Props<'Item'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth();
  const item = state.data?.items.find(i => i.id === route.params.itemId), role = state.data?.me.role, offers = state.data?.offers.filter(o => o.itemId === item?.id && ['active', 'pending', 'partially_accepted'].includes(o.status)) ?? [], valid = item && active(item.status) && Date.parse(item.endsAt) > Date.now();
  if (role !== 'farmer') return <BuyerItemScreen item={item} state={state} action={action} demoApiToken={demoApiToken} navigation={navigation} />;
  return <FarmerPage title={item?.kind === 'fixed' ? 'Fixed Listing Details' : 'Auction Details'} back hasData={!!state.data} loading={state.loading} error={state.error} mutationError={action.error} retry={() => void state.refresh()}>{item ? <><Card><SectionTitle title={`${item.batch.crop} · ${item.batch.code}`} icon={cropArtwork(item.batch.crop)} /><Text style={ui.value}>{quintals(item.remainingKg)}</Text><Text style={ui.muted}>{item.remainingKg} KG remaining · ₹{item.pricePerKg}/KG · {item.status}</Text><View style={ui.listingMeta}><Badge>{item.kind === 'auction' ? 'AUCTION' : 'FIXED PRICE'}</Badge><Badge>Grade {item.batch.grade ?? 'Not declared'}</Badge></View><Text style={ui.muted}>Ends {new Date(item.endsAt).toLocaleString()}</Text>{role === 'farmer' && <Text style={ui.muted}>{offers.length} eligible offers/requests</Text>}{item.kind === 'auction' && <Text style={ui.source}>Expiry does not award an auction. The farmer decides which eligible offers to accept.</Text>}{role === 'farmer' && <Button title={item.kind === 'auction' ? 'View Buyer Offers' : 'View Purchase Requests'} onPress={() => navigation.navigate('Offers', { itemId: item.id, kind: item.kind })} />}{role === 'farmer' && valid && <Button title="Close Early" disabled={action.pending} onPress={() => { if (!demoApiToken) return; void action.run<unknown>(() => item.kind === 'auction' ? mutations.closeAuction(item.id, { bearerToken: demoApiToken }) : mutations.closeFixedListing(item.id, { bearerToken: demoApiToken })); }} />}</Card><ProfileCard profile={state.data?.profiles.find(p => p.id === item.batch.farmerId)} /></> : state.data && <Text style={ui.muted}>This listing is unavailable. Refresh Sell.</Text>}</FarmerPage>;
}

function BuyerItemScreen({ item, state, action, demoApiToken, navigation }: { item?: TradingItem; state: ReturnType<typeof useTrading>; action: ReturnType<typeof useTradingAction>; demoApiToken: string | null; navigation: Props<'Item'>['navigation'] }) {
  const role = state.data?.me.role;
  const valid = item && active(item.status) && Date.parse(item.endsAt) > Date.now();
  return <TradingPage title={item?.kind === 'fixed' ? 'Fixed Listing Details' : 'Auction Details'} hasData={!!state.data} loading={state.loading} error={state.error} mutationError={action.error} retry={() => void state.refresh()}>{item ? <><TradingCard><View style={ui.listingTop}><Image source={cropArtwork(item.batch.crop)} resizeMode="contain" style={ui.cropImage} /><View style={ui.listingCopy}><Text style={ui.cropTitle}>{item.batch.crop}</Text><Badge>{item.kind === 'auction' ? 'AUCTION' : 'FIXED PRICE'}</Badge><Text style={ui.muted}>Farmer Declared Grade {item.batch.grade ?? 'Not declared'}</Text></View></View><View style={ui.priceRow}><View style={ui.priceMetric}><Text style={ui.small}>REMAINING</Text><Text style={ui.priceMetricValue}>{item.remainingKg} KG</Text></View><View style={ui.priceMetric}><Text style={ui.small}>{item.kind === 'auction' ? 'RESERVE PRICE' : 'FIXED PRICE'}</Text><Text style={ui.priceMetricValue}>{money(item.pricePerKg)}/KG</Text></View></View><Text style={ui.muted}>Ends {date(item.endsAt)}</Text><Badge>{item.status.replaceAll('_', ' ')}</Badge>{role === 'buyer' && valid && (item.kind === 'fixed' || item.status === 'open') && <TradingButton title={item.kind === 'auction' ? 'Place / Revise Bid' : 'Request Purchase'} onPress={() => navigation.navigate('BidForm', { itemId: item.id })} />}</TradingCard><ProfileCard profile={state.data?.profiles.find(p => p.id === item.batch.farmerId)} /></> : state.data && <Text>This listing is unavailable. Refresh Market or Sell.</Text>}</TradingPage>;
}

export function OffersScreen({ route, navigation }: Props<'Offers'>) {
  const state = useTrading();
  const offers = state.data?.offers.filter(o => (!route.params?.kind || o.kind === route.params.kind) && (!route.params?.itemId || o.itemId === route.params.itemId) && ['active', 'pending', 'partially_accepted'].includes(o.status)).sort((a, b) => b.pricePerKg - a.pricePerKg) ?? [];
  return <FarmerPage title={route.params?.kind === 'fixed' ? 'Purchase Requests' : 'Buyer Offers'} back hasData={!!state.data} loading={state.loading} error={state.error} retry={() => void state.refresh()}><Text style={ui.muted}>The farmer may choose any eligible offer. Highest price is not automatically accepted.</Text>{state.data && !offers.length && <View style={ui.empty}><Text style={ui.emptyTitle}>No eligible offers yet</Text><Text style={ui.muted}>Buyer offers and requests will appear here.</Text></View>}{offers.map(offer => { const profile = state.data?.profiles.find(p => p.id === offer.buyerId); return <Card key={offer.id}><SectionTitle title={profile?.name ?? 'Buyer'} icon={sellAssets.tomato} /><View style={ui.trust}><Text style={ui.muted}>Trust Score: {profile?.trustScore == null ? 'Not available' : profile.trustScore + '/100'}</Text><Text style={ui.muted}>{quintals(offer.remainingKg)} · ₹{offer.pricePerKg}/KG · {offer.advancePercent}% advance</Text></View><Badge>{offer.status}</Badge><Button title="View Offer" onPress={() => navigation.navigate('Offer', { offerId: offer.id })} outline /></Card>; })}</FarmerPage>;
}

export function OfferScreen({ route, navigation }: Props<'Offer'>) {
  const state = useTrading(), action = useTradingAction(state.refresh), { demoApiToken } = useAuth(), [quantity, setQuantity] = useState('');
  const offer = state.data?.offers.find(o => o.id === route.params.offerId), item = state.data?.items.find(i => i.id === offer?.itemId), limit = offer && item ? Math.min(offer.remainingKg, item.remainingKg, item.batch.quantityKg) : 0, q = Number(quantity);
  function acceptOffer() {
    if (!offer || !demoApiToken) return;
    if (offer.kind === 'auction') void action.run(() => mutations.acceptBid(offer.id, { quantityKg: q }, { bearerToken: demoApiToken }), result => navigation.navigate('Order', { orderId: result.data.orderId }));
    else void action.run(() => mutations.acceptPurchaseRequest(offer.id, { quantityKg: q }, { bearerToken: demoApiToken }), result => navigation.navigate('Order', { orderId: result.data.orderId }));
  }
  function rejectOffer() {
    if (!offer || !demoApiToken) return;
    if (offer.kind === 'auction') void action.run<unknown>(() => mutations.rejectBid(offer.id, { bearerToken: demoApiToken }));
    else void action.run<unknown>(() => mutations.rejectPurchaseRequest(offer.id, { bearerToken: demoApiToken }));
  }
  return <FarmerPage title="Offer Details" back hasData={!!state.data} loading={state.loading} error={state.error} mutationError={action.error} retry={() => void state.refresh()}>{offer && <><ProfileCard profile={state.data?.profiles.find(p => p.id === offer.buyerId)} /><Card><SectionTitle title={offer.kind === 'fixed' ? 'Fixed-price request' : 'Auction bid'} /><Text style={ui.value}>{quintals(offer.remainingKg)}</Text><Text style={ui.muted}>₹{offer.pricePerKg}/KG · {offer.advancePercent}% advance · {offer.status}</Text><Text style={ui.muted}>Delivery: {offer.delivery ?? 'Unavailable'}</Text><Field label={`Accept quantity (KG), maximum ${limit}`} numeric value={quantity} onChange={setQuantity} /><Button title="Use full remaining quantity" onPress={() => setQuantity(String(limit))} outline /><Button title={action.pending ? 'Accepting…' : 'Accept Offer'} disabled={action.pending || !['active', 'pending', 'partially_accepted'].includes(offer.status) || !Number.isFinite(q) || q <= 0 || q > limit} onPress={acceptOffer} /><Button title={action.pending ? 'Working…' : offer.kind === 'auction' ? 'Reject Offer' : 'Reject Request'} disabled={action.pending || !['active', 'pending', 'partially_accepted'].includes(offer.status)} onPress={() => Alert.alert('Reject this request?', 'This cannot be undone.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Reject', style: 'destructive', onPress: rejectOffer }])} /></Card></>}</FarmerPage>;
}
