export type Crop = 'Tomato' | 'Onion' | 'Potato';
export type MarketPoint = {
  crop: Crop; mandi: string; district: string | null; state: string;
  minPricePerKg: number | null; maxPricePerKg: number | null; modalPricePerKg: number;
  observedAt: string; source: string; isDemo: boolean;
};
export type MarketHistory = { crop: Crop; days: 30 | 60 | 90; points: MarketPoint[]; retrievedAt: string; fallback: boolean };
export type PriceInsight = {
  crop: Crop; horizonDays: 7; quantityKg: number;
  market: MarketPoint & { latestModalPricePerKg: number; latestModalPricePerQuintal: number };
  trend: { direction: 'up' | 'flat' | 'down'; change30dPercent: number; volatility: number; movingAverage7d: number; movingAverage30d: number; marketSpread: number | null; observationDays: number };
  quality: { grade: 'A' | 'B' | 'C' | null; source: 'farmer_declared' };
  demand: { level: 'low' | 'moderate' | 'high'; activeBuyerSignals: number };
  recommendation: { suggestedMinPricePerKg: number; suggestedMaxPricePerKg: number; suggestedReservePricePerKg: number; confidence: 'low' | 'moderate' | 'high'; mode: 'statistical_fallback' | 'ai_assisted'; reasoning: string };
};
