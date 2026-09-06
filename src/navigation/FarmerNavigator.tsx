import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
};

const Stack = createNativeStackNavigator<FarmerStackParamList>();

export function FarmerNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Personal"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Personal" component={FarmerPersonalScreen} />
      <Stack.Screen name="FarmDetails" component={FarmerDetailsScreen} />
      <Stack.Screen name="Review" component={FarmerReviewScreen} />
      <Stack.Screen name="Submitted" component={ProfileSubmittedScreen} />
      <Stack.Screen name="Dashboard" component={FarmerDashboardScreen} />
    </Stack.Navigator>
  );
}
