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

export function validateServerEnvironment() {
  if (!env.supabaseUrl) {
    throw new Error('Missing required server environment: SUPABASE_URL');
  }

  if (!env.supabaseServiceRoleKey) {
    throw new Error('Missing required server environment: SUPABASE_SERVICE_ROLE_KEY');
  }
}
