import type { Crop, MarketHistory, MarketPoint, PriceInsight } from '../types/market.js';
import { ApiError } from '../utils/apiError.js';
import { isCrop } from '../utils/validation.js';
import { parseMarketConfig, type MarketConfig } from '../config/marketConfig.js';

export interface MarketRepository {
  history(crop: Crop, days: 30 | 60 | 90): Promise<MarketPoint[]>;
  cache?(points: MarketPoint[]): Promise<void>;
}
export interface PriceInsightAiProvider {
  explainRecommendation(input: PriceInsight): Promise<{ reasoning: string }>;
}
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
const round = (value: number) => Math.round(value * 100) / 100;

export function normalizeGovernmentRow(row: Record<string, unknown>, crop: Crop): MarketPoint | null {
  if (row.commodity !== crop || typeof row.market !== 'string' || typeof row.state !== 'string') return null;
  const rawDate = String(row.arrival_date ?? '');
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(rawDate);
  const date = parts ? parts[3] + '-' + parts[2] + '-' + parts[1] : rawDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const observed = new Date(date + 'T00:00:00.000Z');
  if (!Number.isFinite(observed.getTime()) || observed.toISOString().slice(0, 10) !== date || observed.getTime() > Date.now() + 86400000) return null;
  const price = (value: unknown) => (typeof value === 'number' || typeof value === 'string') && String(value).trim() ? Number(value) / 100 : NaN;
  const min = price(row.min_price), max = price(row.max_price), modal = price(row.modal_price);
  if (![min, max, modal].every(value => Number.isFinite(value) && value > 0) || min > modal || modal > max) return null;
  return { crop, mandi: row.market, state: row.state, district: typeof row.district === 'string' ? row.district : null,
    minPricePerKg: min, maxPricePerKg: max, modalPricePerKg: modal,
    observedAt: observed.toISOString(), source: 'data.gov.in / AGMARKNET', isDemo: false };
}

export function createMarketService(repository: MarketRepository, config: MarketConfig = parseMarketConfig({}), fetcher: typeof fetch = fetch) {
  const cache = new Map<string, { at: number; points: MarketPoint[] }>();
  async function official(crop: Crop, district?: string): Promise<MarketPoint[]> {
    if (config.provider !== 'data_gov' || !config.apiKey || !config.resourceId) return [];
    const key = crop + ':' + (district ?? '');
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < 15 * 60000) return cached.points;
    const url = new URL(config.apiBaseUrl + '/' + encodeURIComponent(config.resourceId));
    url.searchParams.set('api-key', config.apiKey);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(config.limit));
    url.searchParams.set('filters[commodity]', crop);
    url.searchParams.set('filters[state.keyword]', 'Maharashtra');
    if (district) url.searchParams.set('filters[district]', district);
    try {
      const response = await fetcher(url, { signal: AbortSignal.timeout(config.timeoutMs), redirect: 'error' });
      if (!response.ok) return [];
      const payload: unknown = await response.json();
      const records = payload && typeof payload === 'object' && 'records' in payload ? payload.records : null;
      const points = Array.isArray(records) ? records.flatMap(row => {
        if (!row || typeof row !== 'object') return [];
        // Do not propagate a provider accidentally echoing the credential in a row.
        if (JSON.stringify(row).includes(config.apiKey)) return [];
        const point = normalizeGovernmentRow(row, crop);
        return point && point.state === 'Maharashtra' && (!district || point.district?.toLowerCase() === district.toLowerCase()) ? [point] : [];
      }) : [];
      if (points.length) {
        cache.set(key, { at: Date.now(), points });
        // A persistence outage must not discard a valid government response.
        try { await repository.cache?.(points); } catch { /* Read fallback remains independent. */ }
      }
      return points;
    } catch { return []; } // Never log a URL containing the API key.
  }
  return {
    async history(cropValue: string, days: 30 | 60 | 90, district?: string): Promise<MarketHistory> {
      if (!isCrop(cropValue)) throw new ApiError(400, 'INVALID_INPUT', 'Crop must be Tomato, Onion or Potato.');
      if (![30, 60, 90].includes(days)) throw new ApiError(400, 'INVALID_INPUT', 'History must be 30, 60 or 90 days.');
      let live = await official(cropValue, district);
      if (!live.length && district?.toLowerCase() !== 'pune') live = await official(cropValue, 'Pune');
      let stored: MarketPoint[] = [];
      try { stored = await repository.history(cropValue, days); }
      catch (error) { if (!live.length) throw error; }
      const local = district ? stored.filter(point => point.district?.toLowerCase() === district.toLowerCase()) : stored;
      const fallback = local.length ? local : stored;
      const points = [...fallback, ...live].filter(p => p.modalPricePerKg > 0 && Number.isFinite(p.modalPricePerKg) && Number.isFinite(Date.parse(p.observedAt)));
      const latestTime = Math.max(...points.map(p => Date.parse(p.observedAt)));
      const unique = new Map(points.filter(p => Date.parse(p.observedAt) >= latestTime - days * 86400000).map(p => [p.mandi + ':' + p.observedAt, p]));
      return { crop: cropValue, days, points: [...unique.values()].sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt)),
        retrievedAt: new Date().toISOString(), fallback: !live.length };
    },
  };
}

export function contextualModifier(quantityKg: number, grade: 'A' | 'B' | 'C' | null, demand: 'low' | 'moderate' | 'high'): number {
  const quality = grade === 'A' ? 0.015 : grade === 'C' ? -0.015 : 0;
  const buyers = demand === 'high' ? 0.015 : demand === 'moderate' ? 0.005 : 0;
  const liquidity = quantityKg >= 1000 ? -0.01 : quantityKg >= 500 ? -0.005 : 0;
  return Math.max(-0.03, Math.min(0.03, quality + buyers + liquidity));
}

export async function recommendPrice(
  history: MarketHistory, quantityKg: number, grade: 'A' | 'B' | 'C' | null,
  activeBuyerSignals: number, ai?: PriceInsightAiProvider,
): Promise<PriceInsight> {
  if (!Number.isFinite(quantityKg) || quantityKg <= 0 || history.points.some(p => !Number.isFinite(p.modalPricePerKg) || p.modalPricePerKg <= 0)) {
    throw new ApiError(400, 'INVALID_INPUT', 'Positive quantity and usable market observations are required.');
  }
  if (!history.points.length) throw new ApiError(503, 'MARKET_UNAVAILABLE', 'No market observations are available. Please retry later.');
  const latest = history.points.at(-1)!;
  const cutoff = Date.parse(latest.observedAt) - 30 * 86400000;
  const recent = history.points.filter(p => Date.parse(p.observedAt) >= cutoff);
  const daily = new Map<string, number[]>();
  for (const point of recent) {
    const day = point.observedAt.slice(0, 10);
    daily.set(day, [...(daily.get(day) ?? []), point.modalPricePerKg]);
  }
  const prices = [...daily.values()].map(mean);
  const avg = mean(prices), ma7 = mean(prices.slice(-7));
  const volatility = Math.sqrt(mean(prices.map(value => (value - avg) ** 2))) / avg;
  const change = (prices.at(-1)! / prices[0] - 1) * 100;
  const momentum = Math.max(-0.1, Math.min(0.1, (ma7 / avg - 1)));
  const demandLevel = activeBuyerSignals > 10 ? 'high' : activeBuyerSignals > 2 ? 'moderate' : 'low';
  const modifier = contextualModifier(quantityKg, grade, demandLevel);
  const center = latest.modalPricePerKg * (1 + momentum) * (1 + modifier);
  const width = Math.min(0.3, Math.max(0.05, volatility));
  const min = Math.max(0.01, round(center * (1 - width))), max = Math.max(min, round(center * (1 + width)));
  const sameDay = recent.filter(p => p.observedAt.slice(0, 10) === latest.observedAt.slice(0, 10)).map(p => p.modalPricePerKg);
  const isDemo = recent.some(p => p.isDemo);
  const stale = Date.now() - Date.parse(latest.observedAt) > 7 * 86400000;
  const result: PriceInsight = {
    crop: history.crop, horizonDays: 7, quantityKg,
    market: { ...latest, latestModalPricePerKg: latest.modalPricePerKg, latestModalPricePerQuintal: latest.modalPricePerKg * 100 },
    trend: { direction: change > 2 ? 'up' : change < -2 ? 'down' : 'flat', change30dPercent: round(change), volatility: round(volatility * 100),
      movingAverage7d: round(ma7), movingAverage30d: round(avg), marketSpread: sameDay.length > 1 ? round(Math.max(...sameDay) - Math.min(...sameDay)) : null, observationDays: prices.length },
    quality: { grade, source: 'farmer_declared' },
    demand: { level: demandLevel, activeBuyerSignals },
    recommendation: { suggestedMinPricePerKg: min, suggestedMaxPricePerKg: max, suggestedReservePricePerKg: min,
      confidence: isDemo || stale || prices.length < 7 ? 'low' : 'moderate', mode: 'statistical_fallback',
      reasoning: 'Based on ' + prices.length + ' observed market days, recent moving averages and price volatility. ' +
        (isDemo ? 'Prototype observations are included. ' : '') + (stale ? 'The latest observation is older than seven days. ' : '') +
        'A bounded statistical/contextual adjustment of ' + round(modifier * 100) + '% uses farmer-declared grade, quantity and demand; market data remains dominant. ' +
        activeBuyerSignals + ' active buyer signals; demand does not guarantee a sale. This seven-day range is a recommendation, not a guaranteed price.' },
  };
  if (ai) {
    try {
      const explanation = await ai.explainRecommendation(result);
      if (typeof explanation.reasoning === 'string' && explanation.reasoning.trim().length >= 20 && explanation.reasoning.length <= 2000 &&
          !/guarantee[ds]?|certified|ai.verified/i.test(explanation.reasoning)) {
        result.recommendation.reasoning = explanation.reasoning.trim() + ' Recommendation only; future prices are not guaranteed.';
        result.recommendation.mode = 'ai_assisted';
      }
    } catch { /* Statistical result remains usable during provider outages. */ }
  }
  return result;
}
