import { useCallback } from 'react';
import { Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { TradingRoutes } from '../../navigation/TradingRoutes';
import type { Crop } from '../../services/api/market.types';
import { tradingClient } from '../../services/api/trading.client';
import { useRemote } from '../../hooks/useRemote';
import { Page, Card, Button, money } from '../../components/trading/TradingUI';

export function MarketScreen({ navigation }: NativeStackScreenProps<TradingRoutes, 'Market'>) {
  return <Page title="Market Prices / Insights">
    {(['Tomato', 'Onion', 'Potato'] as const).map(crop => <CropCard key={crop} crop={crop} open={() => navigation.navigate('MarketDetails', { crop })} />)}
  </Page>;
}
function CropCard({ crop, open }: { crop: Crop; open: () => void }) {
  const state = useRemote(useCallback(() => tradingClient.history(crop, 30), [crop]));
  const points = state.data?.points ?? [], latest = points.at(-1);
  const change = latest && points[0] ? (latest.modalPricePerKg / points[0].modalPricePerKg - 1) * 100 : null;
  return <Card title={crop}>{state.loading && <Text>Loading market…</Text>}{state.error && <><Text>{state.error}</Text><Button title="Retry" onPress={() => void state.refresh()} /></>}
    {latest ? <><Text>{money(latest.modalPricePerKg * 100)}/Quintal</Text><Text>{change === null ? 'Trend unavailable' : (change > 2 ? 'Up' : change < -2 ? 'Down' : 'Flat') + ' · ' + change.toFixed(1) + '%'}</Text>
      <Text>{latest.isDemo ? 'Demo market data' : 'Market data: AGMARKNET'}</Text></> : state.data && <Text>No market observations available.</Text>}
    <Button title="View Details" onPress={open} />
  </Card>;
}
export function MarketDetailsBody({ crop }: { crop: Crop }) {
  const state = useRemote(useCallback(() => tradingClient.history(crop, 30), [crop]));
  const points = state.data?.points ?? [], latest = points.at(-1);
  return <Card title={crop + ' market summary'}>
    {state.loading && <Text>Loading observations…</Text>}{state.error && <><Text>{state.error}</Text><Button title="Retry" onPress={() => void state.refresh()} /></>}
    {latest ? <><Text>Current: {money(latest.modalPricePerKg * 100)}/Quintal</Text><Text>Min: {money(latest.minPricePerKg == null ? null : latest.minPricePerKg * 100)} · Max: {money(latest.maxPricePerKg == null ? null : latest.maxPricePerKg * 100)}/Quintal</Text><Text>{latest.isDemo ? 'Demo market data' : 'Market data: AGMARKNET'}</Text></> : state.data && <Text>No market observations available.</Text>}
  </Card>;
}
export function MarketDetailsScreen({ route }: NativeStackScreenProps<TradingRoutes, 'MarketDetails'>) {
  return <Page title="Crop Market Details"><MarketDetailsBody crop={route.params.crop} /></Page>;
}
