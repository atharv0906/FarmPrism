import { Router } from 'express';
import { checkSupabaseReadiness } from '../lib/supabaseReadiness.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'farmprism-api',
  });
});

router.get('/ready', async (_req, res) => {
  try {
    await checkSupabaseReadiness();
    res.json({ ok: true, service: 'farmprism-api', supabase: 'ready' });
  } catch {
    res.status(503).json({ ok: false, service: 'farmprism-api', supabase: 'unavailable' });
  }
});

export default router;
