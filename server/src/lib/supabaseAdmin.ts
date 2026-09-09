import { createClient } from '@supabase/supabase-js';

import { env, validateServerEnvironment } from '../config/env.js';

validateServerEnvironment();

export const supabaseAdmin = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function getSupabaseAdmin() {
  validateServerEnvironment();
  return supabaseAdmin;
}
