const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const mockOtp = __DEV__ && process.env.EXPO_PUBLIC_MOCK_OTP === 'true';

export const publicEnv = {
  supabaseUrl,
  supabasePublicKey,
  mockOtp,
};

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabasePublicKey);
}
