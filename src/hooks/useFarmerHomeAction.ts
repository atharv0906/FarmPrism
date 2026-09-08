import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FarmerStackParamList } from '../navigation/FarmerNavigator';
import type { Destination } from '../components/farmer-dashboard/dashboardData';

export type HomeActionContext = { cropId: string; cropName: string };

export function useFarmerHomeAction() {
  const navigation = useNavigation<NativeStackNavigationProp<FarmerStackParamList>>();
  return (destination: Destination, context?: HomeActionContext) => {
    if (destination === 'Notifications') { navigation.navigate('Notifications'); return; }
    if (destination === 'My Farm') { navigation.navigate('MyFarm'); return; }
    // Unbuilt feature intent stays explicit and does not select an unavailable tab.
    Alert.alert('Coming Soon', `${destination}${context ? ` — ${context.cropName}` : ''} will be available soon.`);
  };
}
