import { TradingNavigator } from '../navigation/TradingNavigator';
import { useAuth } from '../hooks/useAuth';

// Keep the existing entry point; all roles share one notification implementation.
export function NotificationsScreen() {
  const { demoAccount } = useAuth();
  return <TradingNavigator role={demoAccount?.role ?? 'farmer'} initial="Notifications" />;
}
