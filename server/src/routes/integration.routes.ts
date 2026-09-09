import type { Router, RequestHandler } from 'express';
import { requireDemoRole, requireDemoSession, type AuthenticatedRequest } from '../middleware/auth.js';
import { tradingWorkspace } from '../repositories/trading.repository.js';
import { createMarketService, recommendPrice, type PriceInsightAiProvider } from '../services/market.service.js';
import { marketRepository, cropDemand } from '../repositories/market.repository.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { object, uuid } from '../utils/mutationValidation.js';
import { isAllowedDays } from '../utils/validation.js';
import { executeRpc } from '../repositories/mutation.repository.js';
import { configuredPriceAiProvider } from '../services/priceAi.provider.js';

const marketService = createMarketService(marketRepository, env.dataGovInApiKey);
export function registerIntegrationRoutes(router: Router, authenticate: RequestHandler = requireDemoSession, market = marketService,
  ai: PriceInsightAiProvider | undefined = configuredPriceAiProvider({ endpoint: env.aiProviderEndpoint, apiKey: env.aiProviderApiKey, model: env.aiProviderModel })) {
  const get: (path: string, handler: (req: AuthenticatedRequest) => Promise<unknown>) => void = (path, handler) =>
    router.get(path, authenticate, (req, res, next) => {
      void handler(req).then(data => { res.setHeader('Cache-Control', 'no-store'); res.json({ data }); }).catch(next);
    });
  get('/api/workspace', req => tradingWorkspace(req.demoSession!.accountId, req.demoSession!.role));
  get('/api/market/:crop/history', req => {
    const days = Number(req.query.days ?? 30);
    if (!isAllowedDays(days)) throw new ApiError(400, 'INVALID_INPUT', 'Choose 30, 60 or 90 days.');
    return market.history(String(req.params.crop), days);
  });
  get('/api/market/:crop/current', async req => {
    const history = await market.history(String(req.params.crop), 30);
    const point = history.points.at(-1);
    if (!point) throw new ApiError(503, 'MARKET_UNAVAILABLE', 'Market data is unavailable.');
    return { ...point, retrievedAt: history.retrievedAt, fallback: history.fallback };
  });
  router.post('/api/farmer/price-insight', authenticate, requireDemoRole('farmer'), (req: AuthenticatedRequest, res, next) => {
    void (async () => {
      const input = object(req.body, ['batchId']);
      const batchId = uuid(input.batchId);
      const workspace = await tradingWorkspace(req.demoSession!.accountId, 'farmer');
      const batch = workspace.batches.find(b => b.id === batchId);
      if (!batch) throw new ApiError(404, 'BATCH_NOT_FOUND', 'Batch not found.');
      const location = workspace.me.location;
      // Only use a district actually indicated by the persisted location.
      const district = location?.split(',').map(part => part.trim()).find(part => /^(Pune|Nashik|Nagpur|Satara|Solapur|Ahmednagar)$/i.test(part));
      const history = await market.history(batch.crop, 90, district);
      const signals = await cropDemand(batch.crop);
      const data = await recommendPrice(history, batch.quantityKg, batch.grade, signals, ai);
      res.json({ data });
    })().catch(next);
  });
  router.post('/api/notifications/:id/read', authenticate, (req: AuthenticatedRequest, res, next) => {
    void (async () => {
      object(req.body ?? {}, []);
      const id = uuid(req.params.id);
      const result = await executeRpc('mark_demo_notification_read', { p_phone: req.demoSession!.phone, p_notification_id: id });
      if (result !== true) throw new ApiError(403, 'FORBIDDEN', 'This notification is not available.');
      res.json({ data: { read: true } });
    })().catch(next);
  });
}
