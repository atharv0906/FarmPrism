import express from 'express';
import healthRoutes from './routes/health.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use('/', healthRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
