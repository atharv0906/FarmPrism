import type { PriceInsightAiProvider } from './market.service.js';

// Vendor-neutral explanation gateway protocol. It cannot change authoritative prices.
export function configuredPriceAiProvider(config: { endpoint?: string; apiKey?: string; model?: string }, fetcher: typeof fetch = fetch): PriceInsightAiProvider | undefined {
  if (!config.endpoint || !config.apiKey || !config.model) return undefined;
  let endpoint: URL;
  try { endpoint = new URL(config.endpoint); } catch { return undefined; }
  if (endpoint.protocol !== 'https:') return undefined;
  return {
    async explainRecommendation(input) {
      const response = await fetcher(endpoint, {
        method: 'POST', signal: AbortSignal.timeout(5000),
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + config.apiKey },
        body: JSON.stringify({ model: config.model, input }),
      });
      if (!response.ok) throw new Error('Explanation provider unavailable.');
      const output: unknown = await response.json();
      if (!output || typeof output !== 'object' || !('reasoning' in output) || typeof output.reasoning !== 'string' || output.reasoning.includes(config.apiKey!)) {
        throw new Error('Invalid explanation.');
      }
      return { reasoning: output.reasoning };
    },
  };
}
