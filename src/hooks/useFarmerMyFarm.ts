import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from './useAuth';
import { farmerSummaryClient } from '../services/api/farmerSummary.client';
import { mapFarmerMyFarm, type FarmerMyFarmData } from '../components/farmer-my-farm/myFarmData';

export function useFarmerMyFarm() {
  const { demoAccount, demoApiToken } = useAuth();
  const phone = demoAccount?.role === 'farmer' ? demoAccount.phone : null;
  const [result, setResult] = useState<{ token: string; data: FarmerMyFarmData } | null>(null);
  const data = result?.token === demoApiToken ? result?.data ?? null : null;
  const [loading, setLoading] = useState(Boolean(phone));
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    if (!phone || !demoApiToken) return;
    const id = ++request.current;
    setLoading(true); setError(null);
    try {
      const data = mapFarmerMyFarm(await farmerSummaryClient.myFarm());
      if (id === request.current) setResult({ token: demoApiToken, data });
    } catch (e) {
      if (id === request.current) setError("We couldn't load your farm details.");
    } finally { if (id === request.current) setLoading(false); }
  }, [phone, demoApiToken]);
  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { request.current++; };
  }, [refresh]));
  return { data, loading, error, refresh };
}
