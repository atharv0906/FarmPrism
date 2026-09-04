import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { RoleSelectionScreen } from '../screens/AuthScreens';

export type OnboardingStackParamList = {
  RoleSelection: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export function OnboardingNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
        options={{ title: 'Choose role' }}
      />
    </Stack.Navigator>
  );
}
