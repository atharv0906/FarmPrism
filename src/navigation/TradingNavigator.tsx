import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TradingRoutes } from './TradingRoutes';
import type { FarmerStackParamList } from './FarmerNavigator';
import type { Role } from '../services/api/trading.types';
import { s } from '../components/trading/TradingUI';
import { SellHomeScreen, SelectBatchScreen, QualityScreen, PriceInsightScreen, ChooseMethodScreen, CreateListingScreen, ItemScreen, OffersScreen, OfferScreen } from '../screens/trading/FarmerSellScreens';
import { MarketScreen, MarketDetailsScreen } from '../screens/trading/MarketScreens';
import { ProfileScreen, OrdersScreen, OrderScreen, TradingNotificationsScreen } from '../screens/trading/SharedScreens';
import { BuyerHomeScreen, MyBidsScreen, BidFormScreen, JobsScreen, JobScreen } from '../screens/trading/BuyerLogisticsScreens';
import { FarmerBottomNav } from '../components/farmer-sell/FarmerSellUI';

const Stack = createNativeStackNavigator<TradingRoutes>();
function Tabs({ role }: { role: Role }) {
  if (role === 'farmer') return <FarmerBottomNav />;
  const navigation = useNavigation<NativeStackNavigationProp<TradingRoutes>>();
  const parent = navigation.getParent<NativeStackNavigationProp<FarmerStackParamList>>();
  const insets = useSafeAreaInsets();
  const route = useNavigationState(state => state.routes[state.index]?.name);
  const tabs: Array<[string, keyof TradingRoutes | 'Dashboard' | 'MyFarm']> = role === 'buyer'
    ? [['Home', 'BuyerHome'], ['Market', 'BuyerMarket'], ['My Bids', 'MyBids'], ['Orders', 'Orders'], ['Profile', 'Profile']]
    : [['Home', 'LogisticsHome'], ['Jobs', 'Jobs'], ['Active', 'Active'], ['History', 'History'], ['Profile', 'Profile']];
  return <View style={[s.tabs, { paddingBottom: Math.max(10, insets.bottom) }]}>{tabs.map(([label, target]) =>
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: route === target }} key={label} style={s.tab} onPress={() => {
      if (target === 'Dashboard' || target === 'MyFarm') parent?.navigate(target);
      else if (target === 'SellHome') navigation.navigate('SellHome');
      else if (target === 'Market') navigation.navigate('Market');
      else if (target === 'Profile') navigation.navigate('Profile');
      else if (target === 'BuyerHome') navigation.navigate('BuyerHome');
      else if (target === 'BuyerMarket') navigation.navigate('BuyerMarket');
      else if (target === 'MyBids') navigation.navigate('MyBids');
      else if (target === 'Orders') navigation.navigate('Orders');
      else if (target === 'LogisticsHome') navigation.navigate('LogisticsHome');
      else if (target === 'Jobs') navigation.navigate('Jobs');
      else if (target === 'Active') navigation.navigate('Active');
      else if (target === 'History') navigation.navigate('History');
    }}><Text style={s.tabText}>{label}</Text></Pressable>)}</View>;
}
export function TradingNavigator({ role, initial = 'SellHome' }: { role: Role; initial?: keyof TradingRoutes }) {
  return <Stack.Navigator initialRouteName={initial} screenLayout={({ children }) => <View style={{ flex: 1 }}>{children}<Tabs role={role} /></View>}
    screenOptions={({ navigation }) => ({ headerShown: role !== 'farmer', headerStyle: { backgroundColor: '#FAFAF2' }, headerTintColor: '#12642D',
      headerRight: () => <Pressable accessibilityRole="button" accessibilityLabel="Notifications" style={{ padding: 10 }} onPress={() => navigation.navigate('Notifications')}><Text style={{ color: '#12642D' }}>Notifications</Text></Pressable> })}>
    {role === 'farmer' && <>
      <Stack.Screen name="SellHome" component={SellHomeScreen} options={{ title: 'Sell' }} />
      <Stack.Screen name="SelectBatch" component={SelectBatchScreen} options={{ title: 'Select Batch' }} />
      <Stack.Screen name="Quality" component={QualityScreen} options={{ title: 'Farmer Declared Quality' }} />
      <Stack.Screen name="PriceInsight" component={PriceInsightScreen} options={{ title: 'Price Insight' }} />
      <Stack.Screen name="ChooseMethod" component={ChooseMethodScreen} options={{ title: 'Choose Selling Method' }} />
      <Stack.Screen name="CreateListing" component={CreateListingScreen} options={{ title: 'Create Listing' }} />
      <Stack.Screen name="Offers" component={OffersScreen} options={{ title: 'Offers / Requests' }} />
      <Stack.Screen name="Offer" component={OfferScreen} options={{ title: 'Offer Details' }} />
    </>}
    {role === 'buyer' && <><Stack.Screen name="BuyerHome" component={BuyerHomeScreen} options={{ title: 'Buyer Marketplace' }} /><Stack.Screen name="BuyerMarket" component={BuyerHomeScreen} options={{ title: 'Market' }} /><Stack.Screen name="MyBids" component={MyBidsScreen} options={{ title: 'My Bids' }} /><Stack.Screen name="BidForm" component={BidFormScreen} options={{ title: 'Buyer Proposal' }} /></>}
    {role === 'logistics' && <><Stack.Screen name="LogisticsHome" component={JobsScreen} options={{ title: 'Logistics Console' }} /><Stack.Screen name="Jobs" component={JobsScreen} /><Stack.Screen name="Active" component={JobsScreen} /><Stack.Screen name="Job" component={JobScreen} /></>}
    <Stack.Screen name="Item" component={ItemScreen} options={{ title: 'Listing Details' }} />
    <Stack.Screen name="History" component={role === 'logistics' ? JobsScreen : OrdersScreen} />
    <Stack.Screen name="Orders" component={OrdersScreen} /><Stack.Screen name="Order" component={OrderScreen} options={{ title: 'Order Details' }} />
    <Stack.Screen name="Profile" component={ProfileScreen} /><Stack.Screen name="Notifications" component={TradingNotificationsScreen} />
    <Stack.Screen name="Market" component={MarketScreen} options={{ title: 'Insights' }} /><Stack.Screen name="MarketDetails" component={MarketDetailsScreen} options={{ title: 'Crop Market Details' }} />
  </Stack.Navigator>;
}
export function FarmerSellNavigator() { return <TradingNavigator role="farmer" />; }
export function FarmerInsightsNavigator() { return <TradingNavigator role="farmer" initial="Market" />; }
