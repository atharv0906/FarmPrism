import type { Request, Response, Router } from 'express';
import { generateSecureToken } from '../repositories/demo.repository.js';

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

function toInventoryBatch(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    batchCode: String(row.batch_code ?? row.batchCode ?? ''),
    cropName: String(row.crop_name ?? row.cropName ?? ''),
    originalQuantityKg: Number(row.original_quantity_kg ?? row.originalQuantityKg ?? 0),
    remainingQuantityKg: Number(row.remaining_quantity_kg ?? row.remainingQuantityKg ?? 0),
    qualityGrade: row.quality_grade ?? null,
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

      const rawToken = generateSecureToken();
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
      const message = 'Internal server error.';
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
      const message = 'Internal server error.';
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

  router.get('/api/profiles/:loginLabel/public', requireDemoSession, async (req: Request, res: Response, next) => {
    try {
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
    } catch (error) {
      next(error);
    }
  });

  router.get('/api/farmer/inventory', requireDemoSession, requireDemoRole('farmer'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const accountId = req.demoSession!.accountId;
      const rows = await getFarmerInventory(accountId);
      res.status(200).json(makeSuccessEnvelope({ batches: (rows ?? []).map((row: Record<string, unknown>) => toInventoryBatch(row)) }));
    } catch (error) {
      const message = 'Internal server error.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/farmer/marketplace', requireDemoSession, requireDemoRole('farmer'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const account = req.demoAccount;
      const accountId = account?.id ?? '';
      const data = await getFarmerMarketplace(accountId);
      res.status(200).json(makeSuccessEnvelope(data));
    } catch (error) {
      const message = 'Internal server error.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/buyer/marketplace', requireDemoSession, requireDemoRole('buyer'), async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await getBuyerMarketplace();
      res.status(200).json(makeSuccessEnvelope(data));
    } catch (error) {
      const message = 'Internal server error.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/buyer/activity', requireDemoSession, requireDemoRole('buyer'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const account = req.demoAccount;
      const accountId = account?.id ?? '';
      const data = await getBuyerActivity(accountId);
      res.status(200).json(makeSuccessEnvelope(data));
    } catch (error) {
      const message = 'Internal server error.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/logistics/jobs', requireDemoSession, requireDemoRole('logistics'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const account = req.demoAccount;
      const accountId = account?.id ?? '';
      const jobs = await getAvailableLogisticsJobs(accountId);
      res.status(200).json(makeSuccessEnvelope({ availableJobs: jobs }));
    } catch (error) {
      const message = 'Internal server error.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/logistics/activity', requireDemoSession, requireDemoRole('logistics'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const account = req.demoAccount;
      const accountId = account?.id ?? '';
      const data = await getLogisticsActivity(accountId);
      res.status(200).json(makeSuccessEnvelope(data));
    } catch (error) {
      const message = 'Internal server error.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/orders', requireDemoSession, async (req: AuthenticatedRequest, res: Response) => {
    const role = req.demoSession?.role as DemoRole | undefined;
    const account = req.demoAccount;
    if (!role || !account) {
      res.status(401).json(makeErrorEnvelope('invalid_session', 'No role found.'));
      return;
    }

    try {
      const orders = await getOrdersForAccount(account.id, role);
      res.status(200).json(makeSuccessEnvelope({ orders, role }));
    } catch (error) {
      const message = 'Internal server error.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });

  router.get('/api/orders/:orderId', requireDemoSession, async (req: AuthenticatedRequest, res: Response) => {
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

      const assignedJob = await getLogisticsJobForOrder(orderId);
      const actorId = req.demoSession!.accountId;
      if (order.farmer_account_id !== actorId && order.buyer_account_id !== actorId && assignedJob?.logistics_account_id !== actorId) {
        res.status(403).json(makeErrorEnvelope('FORBIDDEN', 'This action is not allowed.'));
        return;
      }
      const [timeline, payments, logisticsJob] = await Promise.all([
        getOrderEvents(orderId),
        getPaymentsForOrder(orderId),
        Promise.resolve(assignedJob),
      ]);

      res.status(200).json(makeSuccessEnvelope({
        order: {
          id: String(order.id),
          sourceType: String(order.source_type ?? 'auction'),
          crop: String(order.crop_name ?? order.crop ?? 'Tomato'),
          quantityKg: Number(order.allocated_quantity_kg ?? order.quantityKg ?? 0),
          unitPrice: Number(order.unit_price_per_kg ?? order.unitPrice ?? 0),
          farmerAdvancePercent: Number(order.farmer_advance_percent ?? order.farmerAdvancePercent ?? 0),
          paymentState: String(order.status ?? 'pending'),
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
      const message = 'Internal server error.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  });
}
