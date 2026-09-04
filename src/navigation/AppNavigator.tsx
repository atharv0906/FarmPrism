import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useRole } from '../hooks/useRole';
import { RoleDashboardPlaceholder } from '../screens/FlowPlaceholderScreens';
import { SplashScreen } from '../screens/SplashScreen';
import type { ApplicationRole } from '../types/role';
import { AuthNavigator } from './AuthNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { ProtectedRoute } from './ProtectedRoute';

type RoleFlowParamList = {
  Dashboard: undefined;
};

const RoleStack = createNativeStackNavigator<RoleFlowParamList>();

function RoleFlowNavigator({ role }: { role: ApplicationRole }) {
  return (
    <RoleStack.Navigator>
      <RoleStack.Screen name="Dashboard" options={{ title: role }}>
        {() => (
          <ProtectedRoute requiredRole={role}>
            <RoleDashboardPlaceholder role={role} />
          </ProtectedRoute>
        )}
      </RoleStack.Screen>
    </RoleStack.Navigator>
  );
}

export function AppNavigator() {
  const { authenticated, loading: authLoading } = useAuth();
  const { loading: languageLoading } = useLanguage();
  const { loading: roleLoading, selectedRole } = useRole();

  if (authLoading || languageLoading || roleLoading) {
    return <SplashScreen />;
  }

  if (!authenticated) {
    return <AuthNavigator />;
  }

  if (!selectedRole) {
    return <OnboardingNavigator />;
  }

  return <RoleFlowNavigator role={selectedRole.code} />;
}
