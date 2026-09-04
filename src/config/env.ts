const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const publicEnv = {
  supabaseUrl,
  supabasePublicKey,
};

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabasePublicKey);
}
