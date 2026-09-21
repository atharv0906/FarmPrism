export type MarketConfig = {
  provider: 'data_gov'; apiBaseUrl: string; apiKey: string; resourceId: string; limit: number; timeoutMs: number;
};

// Pure parsing keeps tests independent of private environment values.
export function parseMarketConfig(input: Record<string, string | undefined>): MarketConfig {
  const value = (key: string) => input[key]?.trim() ?? '';
  const provider = value('MARKET_PROVIDER') || 'data_gov';
  if (provider !== 'data_gov') throw new Error('MARKET_PROVIDER must be data_gov.');
  const apiBaseUrl = value('MARKET_API_BASE_URL') || 'https://api.data.gov.in/resource';
  let url: URL;
  try { url = new URL(apiBaseUrl); } catch { throw new Error('MARKET_API_BASE_URL must be a valid HTTPS URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('MARKET_API_BASE_URL must be HTTPS without credentials, query or fragment.');
  }
  function integer(key: string, fallback: number, max: number) {
    const raw = value(key);
    if (!raw) return fallback;
    const parsed = Number(raw);
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(parsed) || parsed < 1 || parsed > max) {
      throw new Error(key + ' must be an integer between 1 and ' + max + '.');
    }
    return parsed;
  }
  return { provider, apiBaseUrl: url.toString().replace(/\/+$/, ''),
    apiKey: value('MARKET_API_KEY') || value('DATA_GOV_IN_API_KEY'), resourceId: value('MARKET_RESOURCE_ID'),
    limit: integer('MARKET_API_LIMIT', 100, 1000), timeoutMs: integer('MARKET_API_TIMEOUT_MS', 10000, 60000) };
}
