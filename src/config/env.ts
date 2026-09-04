const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublicKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
// Development uses mock OTP by default until real SMS is configured.
// Set EXPO_PUBLIC_MOCK_OTP=false when switching to real Supabase phone OTP.
const mockOtp = __DEV__ && process.env.EXPO_PUBLIC_MOCK_OTP !== 'false';
export const publicEnv = { supabaseUrl, supabasePublicKey, mockOtp };
export function hasSupabaseConfig(){return Boolean(supabaseUrl&&supabasePublicKey)}
