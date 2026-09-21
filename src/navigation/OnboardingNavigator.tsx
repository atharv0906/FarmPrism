import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';

export type OnboardingStackParamList = {
  RoleSelection: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
      />
    </Stack.Navigator>
  );
}
