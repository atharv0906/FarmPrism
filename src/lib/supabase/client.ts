import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';

import { publicEnv } from '../../config/env';
import type { Database } from './types';

if (!publicEnv.supabaseUrl || !publicEnv.supabasePublicKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or a public Supabase key.',
  );
}

export const supabase = createClient<Database>(
  publicEnv.supabaseUrl,
  publicEnv.supabasePublicKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | undefined;

export function initializeAuthSessionRefresh() {
  if (appStateSubscription) {
    return () => undefined;
  }

  supabase.auth.startAutoRefresh();
  appStateSubscription = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });

  return () => {
    appStateSubscription?.remove();
    appStateSubscription = undefined;
    supabase.auth.stopAutoRefresh();
  };
}

initializeAuthSessionRefresh();
