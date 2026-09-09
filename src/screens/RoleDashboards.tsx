import { TradingNavigator } from '../navigation/TradingNavigator';

// Existing shell entry points now include the shared state-dependent routes.
export function BuyerDashboardShell() {
  return <TradingNavigator role="buyer" initial="BuyerHome" />;
}
export function LogisticsDashboardShell() {
  return <TradingNavigator role="logistics" initial="LogisticsHome" />;
}
