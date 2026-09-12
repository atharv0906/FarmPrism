import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from './useAuth';
import { tradingClient } from '../services/api/trading.client';
import type { TradingWorkspace } from '../services/api/trading.types';

export function useTrading() {
  const { demoApiToken } = useAuth();
  const [result, setResult] = useState<{ token: string; data: TradingWorkspace } | null>(null);
  const data = result?.token === demoApiToken ? result?.data ?? null : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++version.current;
    setLoading(true); setError(null);
    try {
      if (!demoApiToken) throw new Error('Sign in again to start a server session.');
      const result = await tradingClient.workspace();
      if (current === version.current) setResult({ token: demoApiToken, data: result });
    } catch (e) { if (current === version.current) setError(e instanceof Error ? e.message : 'Unable to load data.'); }
    finally { if (current === version.current) setLoading(false); }
  }, [demoApiToken]);
  useFocusEffect(useCallback(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 20000);
    return () => { clearInterval(timer); version.current++; };
  }, [refresh]));
  return { data, hasData: !!data, loading, error, refresh };
}
