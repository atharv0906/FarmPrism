import { useCallback } from 'react';
import { Image, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TradingRoutes } from '../../navigation/TradingRoutes';
import type { Crop } from '../../services/api/market.types';
import { tradingClient } from '../../services/api/trading.client';
import { useRemote } from '../../hooks/useRemote';
import { Page, Card, Button, money, LoadState, cropArtwork, ui } from '../../components/farmprism-shell/RoleUI';

export function MarketScreen({ navigation }: NativeStackScreenProps<TradingRoutes, 'Market'>) {
  const state = useRemote(useCallback(() => Promise.all((['Tomato', 'Onion', 'Potato'] as const).map(crop => tradingClient.current(crop))), []));
  return <Page title="Market Prices / Insights" {...state} hasData={!!state.data} retry={() => void state.refresh()}>
    {state.data?.map(point => <Card key={point.crop}><View style={ui.listingTop}><Image source={cropArtwork(point.crop)} resizeMode="contain" style={ui.cropImage} /><View style={ui.listingCopy}><Text style={ui.cropTitle}>{point.crop}</Text><Text style={ui.small}>CURRENT MARKET PRICE</Text></View></View>
      <Text style={ui.priceHero}>{money(point.modalPricePerKg * 100)}/Quintal</Text><Text style={ui.muted}>{point.mandi}</Text>
      <Button title="View Details" onPress={() => navigation.navigate('MarketDetails', { crop: point.crop })} />
    </Card>)}
    {state.data && <Text style={ui.source}>{state.data.some(point => point.isDemo) ? 'Demo market data' : 'Market data: AGMARKNET'}</Text>}
  </Page>;
}
export function MarketDetailsBody({ crop }: { crop: Crop }) {
  const state = useRemote(useCallback(() => tradingClient.current(crop), [crop]));
  const point = state.data;
  return <Card title={crop + ' market summary'}><LoadState {...state} hasData={!!point} retry={() => void state.refresh()} />
    {point && <><Image source={cropArtwork(crop)} resizeMode="contain" style={ui.cropImage} /><Text style={ui.small}>CURRENT MARKET PRICE</Text><Text style={ui.priceHero}>{money(point.modalPricePerKg * 100)}/Quintal</Text>
      <View style={ui.priceRow}><View style={ui.priceMetric}><Text style={ui.small}>MINIMUM</Text><Text style={ui.priceMetricValue}>{money(point.minPricePerKg == null ? null : point.minPricePerKg * 100)}</Text></View><View style={ui.priceMetric}><Text style={ui.small}>MAXIMUM</Text><Text style={ui.priceMetricValue}>{money(point.maxPricePerKg == null ? null : point.maxPricePerKg * 100)}</Text></View></View>
      <Text style={ui.muted}>Market range in ₹/Quintal · {point.mandi}</Text><Text style={ui.disclaimer}>Prices may vary with market demand and mandi conditions.</Text><Text style={ui.source}>{point.isDemo ? 'Demo market data' : 'Market data: AGMARKNET'}</Text></>}
  </Card>;
}
export function MarketDetailsScreen({ route }: NativeStackScreenProps<TradingRoutes, 'MarketDetails'>) {
  return <Page title="Crop Market Details"><MarketDetailsBody crop={route.params.crop} /></Page>;
}
