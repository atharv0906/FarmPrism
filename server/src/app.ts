import express from 'express';
import { registerMutationRoutes } from './routes/mutation.routes.js';
import { registerDemoRoutes } from './routes/demo.routes.js';
import healthRoutes from './routes/health.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use('/', healthRoutes);
  registerDemoRoutes(app);
  registerMutationRoutes(app);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
