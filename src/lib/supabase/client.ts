import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { publicEnv } from '../../config/env';
import type { Database } from './types';

export const supabase: SupabaseClient<Database> | null =
  publicEnv.supabaseUrl && publicEnv.supabasePublicKey
    ? createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabasePublicKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export function requireSupabaseClient(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and a public Supabase key.',
    );
  }

  return supabase;
}

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | undefined;

export function initializeAuthSessionRefresh() {
  if (!supabase || appStateSubscription) {
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
