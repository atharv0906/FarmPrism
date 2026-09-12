import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Alert, Pressable, Text } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMockFlowService } from '../services/roles/mockFlow.service';
import { SplashScreen } from '../screens/SplashScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { FarmerMyFarmScreen } from '../screens/FarmerMyFarmScreen';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { TradingRoutes } from './TradingRoutes';
import { FarmerSellNavigator, FarmerInsightsNavigator } from './TradingNavigator';

import {
  FarmerDashboardScreen,
  FarmerDetailsScreen,
  FarmerPersonalScreen,
  FarmerReviewScreen,
  ProfileSubmittedScreen,
} from '../screens/FarmerScreens';

export type FarmerStackParamList = {
  Personal: undefined;
  FarmDetails: undefined;
  Review: undefined;
  Submitted: undefined;
  Dashboard: undefined;
  MyFarm: undefined;
  Notifications: undefined;
  Sell: NavigatorScreenParams<TradingRoutes> | undefined;
  Insights: NavigatorScreenParams<TradingRoutes> | undefined;
};

const Stack = createNativeStackNavigator<FarmerStackParamList>();

export function FarmerNavigator() {
  const { demoAccount, logout } = useAuth();
  const [initialRoute, setInitialRoute] = useState<'Personal' | 'Dashboard' | null>(null);
  useEffect(() => {
    let active = true;
    const start = demoAccount?.role === 'farmer' ? createMockFlowService(AsyncStorage).farmerStart(demoAccount.phone) : Promise.resolve('Personal' as const);
    void start.then(route => { if (active) setInitialRoute(route); }).catch(() => { if (active) setInitialRoute('Personal'); });
    return () => { active = false; };
  }, [demoAccount?.phone]);
  if (!initialRoute) return <SplashScreen />;
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Personal" component={FarmerPersonalScreen} options={{ headerShown: true, title: 'Farmer Profile', headerTintColor: '#12642D', headerRight: () => <Pressable accessibilityRole="button" accessibilityLabel="Sign out" style={{ padding: 8 }} onPress={() => void logout().catch(e => Alert.alert('Unable to sign out', e instanceof Error ? e.message : 'Please retry.'))}><Text style={{ color: '#12642D' }}>Sign out</Text></Pressable> }} />
      <Stack.Screen name="FarmDetails" component={FarmerDetailsScreen} />
      <Stack.Screen name="Review" component={FarmerReviewScreen} />
      <Stack.Screen name="Submitted" component={ProfileSubmittedScreen} />
      <Stack.Screen name="Dashboard" component={FarmerDashboardScreen} />
      <Stack.Screen name="MyFarm" component={FarmerMyFarmScreen} />
      <Stack.Screen name="Sell" component={FarmerSellNavigator} />
      <Stack.Screen name="Insights" component={FarmerInsightsNavigator} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, title: 'Notifications', headerTintColor: '#12642D', headerStyle: { backgroundColor: '#FAFAF2' } }} />
    </Stack.Navigator>
  );
}
