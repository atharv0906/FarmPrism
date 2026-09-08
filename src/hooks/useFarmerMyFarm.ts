import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from './useAuth';
import { demoService } from '../services/demo/demo.service';
import { mapFarmerMyFarm, type FarmerMyFarmData } from '../components/farmer-my-farm/myFarmData';

export function useFarmerMyFarm() {
  const { demoAccount } = useAuth();
  const phone = demoAccount?.role === 'farmer' ? demoAccount.phone : null;
  const [data, setData] = useState<FarmerMyFarmData | null>(null);
  const [loading, setLoading] = useState(Boolean(phone));
  const [error, setError] = useState<string | null>(null);
  const request = useRef(0);
  const refresh = useCallback(async () => {
    if (!phone) return;
    const id = ++request.current;
    setLoading(true); setError(null);
    try {
      const result = mapFarmerMyFarm(await demoService.farmerMyFarm(phone));
      if (id === request.current) setData(result);
    } catch (e) {
      if (id === request.current) setError("We couldn't load your farm details.");
    } finally { if (id === request.current) setLoading(false); }
  }, [phone]);
  useFocusEffect(useCallback(() => {
    void refresh();
    return () => { request.current++; };
  }, [refresh]));
  return { data, loading, error, refresh };
}