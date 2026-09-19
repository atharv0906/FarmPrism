import express from 'express';
import { registerFarmerInventoryRoutes } from './routes/farmerInventory.routes.js';
import { registerFarmerSummaryRoutes } from './routes/farmerSummary.routes.js';
import { registerIntegrationRoutes } from './routes/integration.routes.js';
import { registerMutationRoutes } from './routes/mutation.routes.js';
import { registerDemoRoutes } from './routes/demo.routes.js';
import healthRoutes from './routes/health.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

export function createApp() {
  const app = express();
  const allowedDevelopmentOrigins = new Set([
    'http://localhost:8081',
    'http://localhost:8082',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8082',
  ]);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedDevelopmentOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });
  app.use(express.json());
  app.use('/', healthRoutes);
  registerIntegrationRoutes(app);
  registerFarmerSummaryRoutes(app);
  registerFarmerInventoryRoutes(app);
  registerDemoRoutes(app);
  registerMutationRoutes(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
