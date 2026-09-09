import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../hooks/useLanguage';
import { useRole } from '../hooks/useRole';
import { BuyerDashboardShell, LogisticsDashboardShell } from '../screens/RoleDashboards';
import { SplashScreen, useSplashCompleted } from '../screens/SplashScreen';
import type { ApplicationRole } from '../types/role';
import { AuthNavigator } from './AuthNavigator';
import { FarmerNavigator } from './FarmerNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { ProtectedRoute } from './ProtectedRoute';
import { FarmerDraftProvider } from '../screens/FarmerScreens';

type RoleFlowParamList = {
  Dashboard: undefined;
};

const RoleStack = createNativeStackNavigator<RoleFlowParamList>();

function RoleFlowNavigator({ role }: { role: ApplicationRole }) {
  if (role === 'farmer') {
    return (
      <ProtectedRoute requiredRole="farmer">
        <FarmerDraftProvider>
          <FarmerNavigator />
        </FarmerDraftProvider>
      </ProtectedRoute>
    );
  }

  if (role === 'buyer') {
    return (
      <RoleStack.Navigator>
        <RoleStack.Screen name="Dashboard" options={{ title: 'Buyer Marketplace' }}>
          {() => (
            <ProtectedRoute requiredRole={role}>
              <BuyerDashboardShell />
            </ProtectedRoute>
          )}
        </RoleStack.Screen>
      </RoleStack.Navigator>
    );
  }

  if (role === 'logistics') {
    return (
      <RoleStack.Navigator>
        <RoleStack.Screen name="Dashboard" options={{ title: 'Logistics Console' }}>
          {() => (
            <ProtectedRoute requiredRole={role}>
              <LogisticsDashboardShell />
            </ProtectedRoute>
          )}
        </RoleStack.Screen>
      </RoleStack.Navigator>
    );
  }

  return (
    <RoleStack.Navigator>
      <RoleStack.Screen name="Dashboard" options={{ title: role }}>
        {() => (
          <ProtectedRoute requiredRole={role}>
            <BuyerDashboardShell />
          </ProtectedRoute>
        )}
      </RoleStack.Screen>
    </RoleStack.Navigator>
  );
}

export function AppNavigator() {
  const { authenticated, loading: authLoading, user } = useAuth();
  const { loading: languageLoading } = useLanguage();
  const { loading: roleLoading, selectedRole } = useRole();
  const splashCompleted = useSplashCompleted();

  if (authLoading || languageLoading || roleLoading || !splashCompleted) {
    return <SplashScreen />;
  }

  if (!authenticated) {
    return <AuthNavigator />;
  }

  if (!selectedRole) {
    return <OnboardingNavigator />;
  }

  return <RoleFlowNavigator key={user?.id} role={selectedRole.code} />;
}
