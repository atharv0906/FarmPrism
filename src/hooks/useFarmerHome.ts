import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from './useAuth';
import { demoService } from '../services/demo/demo.service';
import { createDashboardFallback, mapFarmerHome, type DashboardData, type DashboardProfile } from '../components/farmer-dashboard/dashboardData';

export function useFarmerHome(draft: DashboardProfile) {
  const { demoAccount } = useAuth();
  const phone = demoAccount?.role === 'farmer' ? demoAccount.phone : null;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(Boolean(phone));
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    if (!phone) return;
    const id = ++request.current;
    setLoading(true); setError(null);
    try {
      const result = mapFarmerHome(await demoService.farmerHome(phone));
      if (id === request.current) setData(result);
    } catch (e) {
      if (id === request.current) setError(e instanceof Error ? e.message : 'Unable to load Home. Please retry.');
    } finally { if (id === request.current) setLoading(false); }
  }, [phone]);
  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { request.current++; };
  }, [refresh]));
  return { data: phone ? data : createDashboardFallback(draft), loading, error, refresh };
}
