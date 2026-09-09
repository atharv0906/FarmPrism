import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
export function useRemote<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null), [error, setError] = useState<string | null>(null), [loading, setLoading] = useState(true);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const v = ++version.current;
    setLoading(true); setError(null);
    try { const result = await load(); if (v === version.current) setData(result); }
    catch (e) { if (v === version.current) setError(e instanceof Error ? e.message : 'Unable to load data.'); }
    finally { if (v === version.current) setLoading(false); }
  }, [load]);
  useFocusEffect(useCallback(() => { setData(null); void refresh(); return () => { version.current++; }; }, [refresh]));
  return { data, error, loading, refresh };
}
