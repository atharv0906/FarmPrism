import type { Request, Response, Router } from 'express';

import {
  createDemoSessionRow,
  findActiveSessionByToken,
  getDemoAccountById,
  getDemoAccountByLoginLabel,
  getDemoAccountByPhone,
  getDemoAccounts,
  getBuyerActivity,
  getBuyerMarketplace,
  getFarmerInventory,
  getFarmerMarketplace,
  getLogisticsActivity,
  getAvailableLogisticsJobs,
  getMarketCurrent,
  getMarketHistory,
  getOrderById,
  getOrderEvents,
  getOrdersForAccount,
  getPaymentsForOrder,
  getLogisticsJobForOrder,
  revokeDemoSessionByToken,
} from '../lib/demoStore.js';
import { requireDemoRole, requireDemoSession, type AuthenticatedRequest } from '../middleware/auth.js';
import type { DemoRole, DemoSessionAccount, PublicProfile } from '../types/domain.js';
import { makeErrorEnvelope, makeSuccessEnvelope, normalizePhone, isSixDigitOtp, parseBearerToken, isAllowedDays, isCrop } from '../utils/validation.js';

function toMarketHistoryPoint(row: Record<string, unknown>) {
  return {
    observedAt: String(row.observed_at ?? row.observedAt ?? new Date().toISOString()),
    pricePerKg: Number(row.price_per_kg ?? row.pricePerKg ?? 0),
    minPricePerKg: Number(row.min_price_per_kg ?? row.minPricePerKg ?? 0),
    maxPricePerKg: Number(row.max_price_per_kg ?? row.maxPricePerKg ?? 0),
    modalPricePerKg: Number(row.modal_price_per_kg ?? row.modalPricePerKg ?? 0),
    source: String(row.source ?? 'supabase'),
    isDemo: Boolean(row.is_demo ?? row.isDemo ?? false),
    mandi: String(row.mandi ?? row.market_name ?? 'N/A'),
    district: String(row.district ?? 'N/A'),
    state: String(row.state ?? 'N/A'),
  };
}

function toInventoryBatch(row: Record<string, unknown>) {
  return {
    batchCode: String(row.batch_code ?? row.batchCode ?? ''),
    cropName: String(row.crop_name ?? row.cropName ?? ''),
    originalQuantityKg: Number(row.original_quantity_kg ?? row.originalQuantityKg ?? 0),
    remainingQuantityKg: Number(row.remaining_quantity_kg ?? row.remainingQuantityKg ?? 0),
    qualityGrade: String(row.quality_grade ?? row.qualityGrade ?? 'C'),
    qualitySource: String(row.quality_source ?? row.qualitySource ?? 'farmer_declared'),
    status: String(row.status ?? 'available'),
  };
}

export function registerDemoRoutes(router: Router) {
  router.post('/api/demo/session', async (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as { phone?: string; otp?: string };
      const phone = normalizePhone(body.phone ?? '');
      const otp = String(body.otp ?? '').trim();

      if (!phone || !isSixDigitOtp(otp)) {
        res.status(400).json(makeErrorEnvelope('bad_input', 'Phone and a 6-digit OTP are required.'));
        return;
      }

      const account = await getDemoAccountByPhone(phone);
      if (!account || !account.isEnabled) {
        res.status(401).json(makeErrorEnvelope('invalid_session', 'Demo account not found or disabled.'));
        return;
      }

      const rawToken = `demo-${account.loginLabel}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const session = await createDemoSessionRow(account.id, rawToken);

      res.status(200).json(makeSuccessEnvelope({
        token: rawToken,
        expiresAt: session.expiresAt,
        account: {
          loginLabel: account.loginLabel,
          phone: account.phone,
          role: account.role,
          fullName: account.fullName,
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create demo session.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.post('/api/demo/logout', requireDemoSession, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const rawToken = parseBearerToken(req.headers.authorization);
      if (!rawToken) {
        res.status(401).json(makeErrorEnvelope('invalid_session', 'Missing bearer token.'));
        return;
      }

      const revoked = await revokeDemoSessionByToken(rawToken);
      if (!revoked) {
        res.status(401).json(makeErrorEnvelope('invalid_session', 'Session not found.'));
        return;
      }

      res.status(200).json(makeSuccessEnvelope({ ok: true }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to log out.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/demo/me', requireDemoSession, (req: AuthenticatedRequest, res: Response) => {
    const session = req.demoSession as DemoSessionAccount | undefined;
    if (!session) {
      res.status(401).json(makeErrorEnvelope('invalid_session', 'Missing demo session.'));
      return;
    }

    const safeProfile = {
      loginLabel: session.loginLabel,
      phone: session.phone,
      fullName: session.fullName,
      role: session.role,
      verification: session.verification ?? null,
      farmLocation: session.farmLocation ?? null,
      farmArea: session.farmArea ?? null,
      businessType: session.businessType ?? null,
      businessName: session.businessName ?? null,
      deliveryLocation: session.deliveryLocation ?? null,
      vehicle: session.vehicle ?? null,
      capacity: session.capacity ?? null,
      currentLocation: session.currentLocation ?? null,
      trustScore: session.trustScore ?? null,
    };

    res.status(200).json(makeSuccessEnvelope(safeProfile));
  });

  router.get('/api/profiles/:loginLabel/public', requireDemoSession, async (req: Request, res: Response) => {
    const loginLabel = String(req.params.loginLabel ?? '');
    const account = await getDemoAccountByLoginLabel(loginLabel);
    if (!account) {
      res.status(404).json(makeErrorEnvelope('not_found', 'Profile not found.'));
      return;
    }

    const publicProfile: PublicProfile = {
      loginLabel: account.loginLabel,
      name: account.fullName,
      role: account.role,
      verification: account.verification ?? null,
      trustScore: account.trustScore ?? null,
      completedTransactions: account.completedTransactions ?? null,
      qualityConsistency: account.qualityConsistency ?? null,
      paymentReliability: account.paymentReliability ?? null,
      deliveryReliability: account.deliveryReliability ?? null,
      businessType: account.businessType ?? null,
      businessName: account.businessName ?? null,
      vehicle: account.vehicle ?? null,
    };

    res.status(200).json(makeSuccessEnvelope(publicProfile));
  });

  router.get('/api/market/:crop/history', requireDemoSession, async (req: Request, res: Response) => {
    const crop = String(req.params.crop ?? '');
    const daysParam = Number(req.query.days ?? 30);

    if (!isCrop(crop)) {
      res.status(400).json(makeErrorEnvelope('bad_input', 'Crop must be Tomato, Onion, or Potato.'));
      return;
    }

    if (!isAllowedDays(daysParam)) {
      res.status(400).json(makeErrorEnvelope('bad_input', 'Days must be one of 30, 60, or 90.'));
      return;
    }

    try {
      const points = await getMarketHistory(crop, daysParam);
      res.status(200).json(makeSuccessEnvelope({
        source: 'supabase',
        isDemo: false,
        crop,
        days: daysParam,
        points: (points ?? []).map((row: Record<string, unknown>) => toMarketHistoryPoint(row)),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load market history.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/market/:crop/current', requireDemoSession, async (req: Request, res: Response) => {
    const crop = String(req.params.crop ?? '');
    if (!isCrop(crop)) {
      res.status(400).json(makeErrorEnvelope('bad_input', 'Crop must be Tomato, Onion, or Potato.'));
      return;
    }

    try {
      const point = await getMarketCurrent(crop);
      res.status(200).json(makeSuccessEnvelope({
        mandi: String(point?.mandi ?? 'N/A'),
        district: String(point?.district ?? 'N/A'),
        state: String(point?.state ?? 'N/A'),
        minPricePerKg: Number(point?.min_price_per_kg ?? point?.minPricePerKg ?? 0),
        maxPricePerKg: Number(point?.max_price_per_kg ?? point?.maxPricePerKg ?? 0),
        modalPricePerKg: Number(point?.modal_price_per_kg ?? point?.modalPricePerKg ?? 0),
        observedAt: String(point?.observed_at ?? point?.observedAt ?? new Date().toISOString()),
        source: String(point?.source ?? 'supabase'),
        isDemo: Boolean(point?.is_demo ?? point?.isDemo ?? false),
        crop,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load market current pricing.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/farmer/inventory', requireDemoSession, requireDemoRole('farmer'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accountId = (await getDemoAccountByLoginLabel(req.demoSession?.loginLabel ?? ''))?.id ?? '';
      const rows = await getFarmerInventory(accountId);
      res.status(200).json(makeSuccessEnvelope({ batches: (rows ?? []).map((row: Record<string, unknown>) => toInventoryBatch(row)) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load farmer inventory.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/farmer/marketplace', requireDemoSession, requireDemoRole('farmer'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const account = req.demoSession ? await getDemoAccountByLoginLabel(req.demoSession.loginLabel) : null;
      const accountId = account?.id ?? '';
      const data = await getFarmerMarketplace(accountId);
      res.status(200).json(makeSuccessEnvelope(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load farmer marketplace.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/buyer/marketplace', requireDemoSession, requireDemoRole('buyer'), async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await getBuyerMarketplace();
      res.status(200).json(makeSuccessEnvelope(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load buyer marketplace.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/buyer/activity', requireDemoSession, requireDemoRole('buyer'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const account = req.demoSession ? await getDemoAccountByLoginLabel(req.demoSession.loginLabel) : null;
      const accountId = account?.id ?? '';
      const data = await getBuyerActivity(accountId);
      res.status(200).json(makeSuccessEnvelope(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load buyer activity.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/logistics/jobs', requireDemoSession, requireDemoRole('logistics'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const account = req.demoSession ? await getDemoAccountByLoginLabel(req.demoSession.loginLabel) : null;
      const accountId = account?.id ?? '';
      const jobs = await getAvailableLogisticsJobs(accountId);
      res.status(200).json(makeSuccessEnvelope({ availableJobs: jobs }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load logistics jobs.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/logistics/activity', requireDemoSession, requireDemoRole('logistics'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const account = req.demoSession ? await getDemoAccountByLoginLabel(req.demoSession.loginLabel) : null;
      const accountId = account?.id ?? '';
      const data = await getLogisticsActivity(accountId);
      res.status(200).json(makeSuccessEnvelope(data));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load logistics activity.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/orders', requireDemoSession, async (req: AuthenticatedRequest, res: Response) => {
    const role = req.demoSession?.role as DemoRole | undefined;
    const account = req.demoSession ? await getDemoAccountByLoginLabel(req.demoSession.loginLabel) : null;
    if (!role || !account) {
      res.status(401).json(makeErrorEnvelope('invalid_session', 'No role found.'));
      return;
    }

    try {
      const orders = await getOrdersForAccount(account.id, role);
      res.status(200).json(makeSuccessEnvelope({ orders, role }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load orders.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/orders/:orderId', requireDemoSession, async (req: Request, res: Response) => {
    const orderId = String(req.params.orderId ?? '');
    if (!orderId || orderId === 'undefined') {
      res.status(400).json(makeErrorEnvelope('bad_input', 'An order id is required.'));
      return;
    }

    try {
      const order = await getOrderById(orderId);
      if (!order) {
        res.status(404).json(makeErrorEnvelope('not_found', 'Order not found.'));
        return;
      }

      const [timeline, payments, logisticsJob] = await Promise.all([
        getOrderEvents(orderId),
        getPaymentsForOrder(orderId),
        getLogisticsJobForOrder(orderId),
      ]);

      res.status(200).json(makeSuccessEnvelope({
        order: {
          id: String(order.id),
          sourceType: String(order.source_type ?? 'auction'),
          crop: String(order.crop_name ?? order.crop ?? 'Tomato'),
          quantityKg: Number(order.quantity_kg ?? order.quantityKg ?? 0),
          unitPrice: Number(order.unit_price ?? order.unitPrice ?? 0),
          farmerAdvancePercent: Number(order.farmer_advance_percent ?? order.farmerAdvancePercent ?? 0),
          paymentState: String(order.payment_state ?? 'pending'),
          logisticsStatus: String(logisticsJob?.status ?? order.logistics_status ?? 'not_assigned'),
          timeline: (timeline ?? []).map((event: Record<string, unknown>) => ({
            label: String(event.event_type ?? event.type ?? 'Update'),
            status: String(event.status ?? 'updated'),
            at: String(event.created_at ?? event.at ?? new Date().toISOString()),
          })),
          payments: (payments ?? []).map((payment: Record<string, unknown>) => ({
            id: String(payment.id),
            amount: Number(payment.amount ?? 0),
            currency: String(payment.currency ?? 'INR'),
            status: String(payment.status ?? 'pending'),
            createdAt: String(payment.created_at ?? new Date().toISOString()),
          })),
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load order details.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });
}
