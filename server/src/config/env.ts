import { config as loadEnv } from 'dotenv';

loadEnv();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  dataGovInApiKey: process.env.DATA_GOV_IN_API_KEY ?? '',
  aiProviderApiKey: process.env.AI_PROVIDER_API_KEY ?? '',
  aiProviderModel: process.env.AI_PROVIDER_MODEL ?? '',
  aiProviderEndpoint: process.env.AI_PROVIDER_ENDPOINT ?? '',
};

const PLACEHOLDER_SERVICE_ROLE_KEYS = new Set([
  'your_actual_service_role_key',
  'your_service_role_key',
  'changeme',
  'placeholder',
]);

export function serviceRoleLooksPlaceholder(value = env.supabaseServiceRoleKey): boolean {
  const normalized = value.trim().toLowerCase();
  return !normalized || PLACEHOLDER_SERVICE_ROLE_KEYS.has(normalized) || normalized.includes('placeholder');
}

export function getEnvironmentStatus() {
  return {
    supabaseUrlConfigured: Boolean(env.supabaseUrl),
    serviceRoleConfigured: Boolean(env.supabaseServiceRoleKey),
    serviceRoleLooksPlaceholder: serviceRoleLooksPlaceholder(),
  };
}

export function validateServerEnvironment() {
  if (!env.supabaseUrl) {
    throw new Error('Missing required server environment: SUPABASE_URL');
  }

  let supabaseUrl: URL;
  try {
    supabaseUrl = new URL(env.supabaseUrl);
  } catch {
    throw new Error('SUPABASE_URL must be a valid HTTPS Supabase URL.');
  }

  if (supabaseUrl.protocol !== 'https:' || !supabaseUrl.hostname.endsWith('.supabase.co')) {
    throw new Error('SUPABASE_URL must be a valid HTTPS Supabase URL.');
  }

  if (!env.supabaseServiceRoleKey) {
    throw new Error('Missing required server environment: SUPABASE_SERVICE_ROLE_KEY');
  }

  if (serviceRoleLooksPlaceholder()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is still a placeholder. Configure server/.env with the real server-side Supabase key.');
  }
}
