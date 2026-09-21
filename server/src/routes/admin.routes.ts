import express, { type Router } from 'express';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { adminRepository } from '../repositories/admin.repository.js';
import { createAdminService, createAdminSessions } from '../services/admin.service.js';
import { requireAdminSession } from '../middleware/adminAuth.middleware.js';
import { parseBearerToken } from '../utils/validation.js';

export function registerAdminRoutes(app: Router, service = createAdminService(adminRepository), sessions = createAdminSessions(env.adminUsername, env.adminPassword)) {
  const router = express.Router();
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  router.post('/login', (req, res, next) => { try { res.json(sessions.login(req.body)); } catch (error) { next(error); } });
  router.use(requireAdminSession(sessions));
  router.post('/logout', (req, res) => { sessions.logout(parseBearerToken(req.headers.authorization)!); res.json({ ok: true }); });
  router.get('/buyers', (req, res, next) => { void service.list(req.query.status).then(data => res.json(data)).catch(next); });
  router.post('/buyers/:accountId/verify', (req, res, next) => { void service.verify(req.params.accountId).then(data => res.json(data)).catch(next); });
  app.use('/api/admin', router);
  app.use('/admin', (_req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    next();
  }, express.static(fileURLToPath(new URL('../../public/admin', import.meta.url))));
}
