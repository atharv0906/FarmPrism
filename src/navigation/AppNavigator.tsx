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

  return <ProtectedRoute requiredRole={role}>{role === 'buyer' ? <BuyerDashboardShell /> : <LogisticsDashboardShell />}</ProtectedRoute>;
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
