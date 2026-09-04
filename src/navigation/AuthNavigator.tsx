import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  AuthenticationScreen,
  EmailVerificationScreen,
  ForgotPasswordScreen,
  GetStartedScreen,
  LanguageSelectionScreen,
  SignUpScreen,
} from '../screens/FlowPlaceholderScreens';

export type AuthStackParamList = {
  GetStarted: undefined;
  LanguageSelection: undefined;
  Authentication: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  EmailVerification: { email: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GetStarted" component={GetStartedScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="Authentication" component={AuthenticationScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
    </Stack.Navigator>
  );
}
