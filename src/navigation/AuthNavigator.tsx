import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SignUpScreen } from '../screens/AuthScreens';
import { PhoneLoginScreen } from '../screens/PhoneLoginScreen';

import { LanguageSelectionScreen } from '../screens/LanguageSelectionScreen';
import { GetStartedScreen } from '../screens/GetStartedScreen';

export type AuthStackParamList = {
  LanguageSelection: undefined;
  GetStarted: undefined;
  PhoneLogin: undefined;
  SignUp: undefined;
};

const Stack =
  createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="LanguageSelection"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="LanguageSelection"
        component={LanguageSelectionScreen}
      />

      <Stack.Screen
        name="GetStarted"
        component={GetStartedScreen}
      />

      <Stack.Screen
        name="PhoneLogin"
        component={PhoneLoginScreen}
      />

      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
      />
    </Stack.Navigator>
  );
}