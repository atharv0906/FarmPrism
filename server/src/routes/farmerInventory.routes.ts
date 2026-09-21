import type { Router, RequestHandler } from 'express';
import { requireDemoRole, requireDemoSession, type AuthenticatedRequest } from '../middleware/auth.js';
import { farmerInventoryRepository } from '../repositories/farmerInventory.repository.js';
import { createFarmerInventoryService } from '../services/farmerInventory.service.js';
const service = createFarmerInventoryService(farmerInventoryRepository);
export function registerFarmerInventoryRoutes(router: Router, inventory = service, authenticate: RequestHandler = requireDemoSession) {
  for (const [path, first] of [['crops', true], ['batches', false]] as const) {
    router.post('/api/farmer/' + path, authenticate, requireDemoRole('farmer'), (req: AuthenticatedRequest, res, next) => {
      void inventory.add(req.demoSession!, req.body, first).then(data => { res.setHeader('Cache-Control', 'no-store'); res.status(201).json({ data }); }).catch(next);
    });
  }
  router.patch('/api/farmer/farm', authenticate, requireDemoRole('farmer'), (req: AuthenticatedRequest, res, next) => {
    void inventory.edit(req.demoSession!, req.body).then(data => { res.setHeader('Cache-Control', 'no-store'); res.json({ data }); }).catch(next);
  });
}
