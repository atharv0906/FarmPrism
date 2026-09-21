import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import { ApiError } from '../services/api/api.client';

export function useTradingAction(refresh: () => Promise<void>) {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run<T>(action: () => Promise<T>, success?: (result: T) => void, failure?: (error: unknown) => void) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError(null);
    try { const result = await action(); await refresh(); success?.(result); }
    catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to complete this action.');
      if (e instanceof ApiError && e.status === 409) await refresh();
      failure?.(e);
    } finally { lock.current = false; setPending(false); }
  }
  function pay(action: () => Promise<unknown>) {
    Alert.alert('Simulated payment', 'This records a prototype payment. No actual money will move.', [
      { text: 'Cancel', style: 'cancel' }, { text: 'Confirm simulated payment', onPress: () => void run(action) },
    ]);
  }
  return { run, pay, pending, error };
}
