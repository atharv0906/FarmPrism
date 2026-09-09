import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FarmerStackParamList } from '../navigation/FarmerNavigator';
import type { Destination } from '../components/farmer-dashboard/dashboardData';

export type HomeActionContext = { cropId: string; cropName: string };

export function useFarmerHomeAction() {
  const navigation = useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();
  return (destination: Destination, context?: HomeActionContext) => {
    if (destination === 'Notifications') { navigation.navigate('Sell', { screen: 'Notifications' }); return; }
    if (destination === 'My Farm') { navigation.navigate('MyFarm'); return; }
    if (destination === 'Farmer Profile') { navigation.navigate('Sell', { screen: 'Profile' }); return; }
    if (destination === 'Offer Details') { navigation.navigate('Sell', { screen: 'Offers', params: { kind: 'auction' } }); return; }
    if (destination === 'Sell > Selling History') { navigation.navigate('Sell', { screen: 'History' }); return; }
    if (destination === 'Sell > Create Listing') { navigation.navigate('Sell', { screen: 'SelectBatch' }); return; }
    if (destination.startsWith('Sell')) {
      navigation.navigate('Sell', destination.includes('Buyer Offers') ? { screen: 'Offers', params: { kind: 'auction' } } : { screen: 'SellHome' });
      return;
    }
    if (destination.startsWith('Insights')) {
      const crop = context?.cropName;
      navigation.navigate('Insights', crop === 'Tomato' || crop === 'Onion' || crop === 'Potato' ? { screen: 'MarketDetails', params: { crop } } : { screen: 'Market' });
      return;
    }
    if (destination.includes('Orders') || destination.includes('History')) { navigation.navigate('Sell', { screen: 'Orders' }); return; }
    // Unbuilt feature intent stays explicit and does not select an unavailable tab.
    Alert.alert('Coming Soon', `${destination}${context ? ` — ${context.cropName}` : ''} will be available soon.`);
  };
}
