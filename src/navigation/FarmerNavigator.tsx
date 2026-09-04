import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
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
};

const Stack = createNativeStackNavigator<FarmerStackParamList>();

export function FarmerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Personal" component={FarmerPersonalScreen} />
      <Stack.Screen name="FarmDetails" component={FarmerDetailsScreen} />
      <Stack.Screen name="Review" component={FarmerReviewScreen} />
      <Stack.Screen name="Submitted" component={ProfileSubmittedScreen} />
    </Stack.Navigator>
  );
}
