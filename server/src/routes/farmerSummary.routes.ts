import type { Router, RequestHandler } from 'express';
import { requireDemoRole, requireDemoSession, type AuthenticatedRequest } from '../middleware/auth.js';
import { farmerSummaryRepository } from '../repositories/farmerSummary.repository.js';
import { createFarmerSummaryService } from '../services/farmerSummary.service.js';
import { createMarketService } from '../services/market.service.js';
import { marketRepository } from '../repositories/market.repository.js';
import { env } from '../config/env.js';

// Summary reads use the existing official/fallback service without persisting market cache rows.
const service = createFarmerSummaryService(farmerSummaryRepository, createMarketService({ history: marketRepository.history }, env.market));
export function registerFarmerSummaryRoutes(router: Router, summaries = service, authenticate: RequestHandler = requireDemoSession) {
  for (const [path, read] of [['home-summary', summaries.home], ['my-farm-summary', summaries.myFarm]] as const) {
    router.get('/api/farmer/' + path, authenticate, requireDemoRole('farmer'), (req: AuthenticatedRequest, res, next) => {
      // Client query/body identity is never used. No snapshot RPC or expiry mutation.
      void read(req.demoSession!.accountId).then(data => { res.setHeader('Cache-Control', 'no-store'); res.json({ data }); }).catch(next);
    });
  }
}
