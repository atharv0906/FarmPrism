import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  GetStartedScreen,
  LanguageSelectionScreen,
  PhoneLoginScreen,
  SignUpScreen,
} from '../screens/AuthScreens';

export type AuthStackParamList = {
  GetStarted: undefined;
  LanguageSelection: undefined;
  PhoneLogin: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator initialRouteName="LanguageSelection" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GetStarted" component={GetStartedScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="PhoneLogin" component={PhoneLoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
