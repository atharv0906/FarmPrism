import type { Request, Response, Router } from 'express';
import { createHash } from 'node:crypto';

import { createDemoSessionRow, getDemoAccountByPhone, getDemoAccountByLoginLabel, getDemoAccounts, revokeDemoSessionByToken } from '../lib/demoStore.js';
import { requireDemoRole, requireDemoSession, type AuthenticatedRequest } from '../middleware/auth.js';
import type { DemoRole, DemoSessionAccount, PublicProfile } from '../types/domain.js';
import { makeErrorEnvelope, makeSuccessEnvelope, normalizePhone, isSixDigitOtp, parseBearerToken } from '../utils/validation.js';

export function registerDemoRoutes(router: Router) {
  router.post('/api/demo/session', (req: Request, res: Response) => {
    try {
      const body = (req.body ?? {}) as { phone?: string; otp?: string };
      const phone = normalizePhone(body.phone ?? '');
      const otp = String(body.otp ?? '').trim();

      if (!phone || !isSixDigitOtp(otp)) {
        res.status(400).json(makeErrorEnvelope('bad_input', 'Phone and a 6-digit OTP are required.'));
        return;
      }

      const account = getDemoAccountByPhone(phone);
      if (!account || !account.isEnabled) {
        res.status(401).json(makeErrorEnvelope('invalid_session', 'Demo account not found or disabled.'));
        return;
      }

      const rawToken = `demo-${account.loginLabel}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const session = createDemoSessionRow(account.id, rawToken);

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

  router.post('/api/demo/logout', requireDemoSession, (req: AuthenticatedRequest, res: Response) => {
    try {
      const rawToken = parseBearerToken(req.headers.authorization);
      if (!rawToken) {
        res.status(401).json(makeErrorEnvelope('invalid_session', 'Missing bearer token.'));
        return;
      }

      const revoked = revokeDemoSessionByToken(rawToken);
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

  router.get('/api/profiles/:loginLabel/public', requireDemoSession, (req: Request, res: Response) => {
    const loginLabel = String(req.params.loginLabel ?? '');
    const account = getDemoAccountByLoginLabel(loginLabel);
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

  router.get('/api/market/:crop/history', requireDemoSession, (req: Request, res: Response) => {
    const crop = String(req.params.crop ?? '');
    const daysParam = Number(req.query.days ?? 30);

    if (!['Tomato', 'Onion', 'Potato'].includes(crop)) {
      res.status(400).json(makeErrorEnvelope('bad_input', 'Crop must be Tomato, Onion, or Potato.'));
      return;
    }

    if (![30, 60, 90].includes(daysParam)) {
      res.status(400).json(makeErrorEnvelope('bad_input', 'Days must be one of 30, 60, or 90.'));
      return;
    }

    const points = [
      { observedAt: '2026-08-30T00:00:00.000Z', pricePerKg: 32, minPricePerKg: 28, maxPricePerKg: 36, modalPricePerKg: 32, source: 'prototype_fallback', isDemo: true, mandi: 'Pune', district: 'Pune', state: 'Maharashtra' },
      { observedAt: '2026-09-02T00:00:00.000Z', pricePerKg: 34, minPricePerKg: 30, maxPricePerKg: 38, modalPricePerKg: 34, source: 'prototype_fallback', isDemo: true, mandi: 'Pune', district: 'Pune', state: 'Maharashtra' },
      { observedAt: '2026-09-05T00:00:00.000Z', pricePerKg: 33, minPricePerKg: 29, maxPricePerKg: 37, modalPricePerKg: 33, source: 'prototype_fallback', isDemo: true, mandi: 'Pune', district: 'Pune', state: 'Maharashtra' },
    ];

    res.status(200).json(makeSuccessEnvelope({
      source: 'prototype_fallback',
      isDemo: true,
      crop,
      days: daysParam,
      points,
    }));
  });

  router.get('/api/market/:crop/current', requireDemoSession, (req: Request, res: Response) => {
    const crop = String(req.params.crop ?? '');
    if (!['Tomato', 'Onion', 'Potato'].includes(crop)) {
      res.status(400).json(makeErrorEnvelope('bad_input', 'Crop must be Tomato, Onion, or Potato.'));
      return;
    }

    res.status(200).json(makeSuccessEnvelope({
      mandi: 'Pune',
      district: 'Pune',
      state: 'Maharashtra',
      minPricePerKg: 29,
      maxPricePerKg: 36,
      modalPricePerKg: 33,
      observedAt: new Date().toISOString(),
      source: 'prototype_fallback',
      isDemo: true,
      crop,
    }));
  });

  router.get('/api/farmer/inventory', requireDemoSession, requireDemoRole('farmer'), (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json(makeSuccessEnvelope({
      batches: [
        {
          batchCode: 'B-1001',
          cropName: 'Tomato',
          originalQuantityKg: 1200,
          remainingQuantityKg: 850,
          qualityGrade: 'A',
          qualitySource: 'farmer_declared',
          status: 'available',
        },
      ],
    }));
  });

  router.get('/api/farmer/marketplace', requireDemoSession, requireDemoRole('farmer'), (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json(makeSuccessEnvelope({
      activeAuctions: [],
      activeFixedPriceListings: [],
      incomingActiveBids: [],
      incomingPendingPurchaseRequests: [],
    }));
  });

  router.get('/api/buyer/marketplace', requireDemoSession, requireDemoRole('buyer'), (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json(makeSuccessEnvelope({
      openAuctions: [],
      activeFixedPriceListings: [],
    }));
  });

  router.get('/api/buyer/activity', requireDemoSession, requireDemoRole('buyer'), (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json(makeSuccessEnvelope({
      activeCurrentBids: [],
      bidHistory: [],
      purchaseRequests: [],
      orders: [],
    }));
  });

  router.get('/api/logistics/jobs', requireDemoSession, requireDemoRole('logistics'), (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json(makeSuccessEnvelope({
      availableJobs: [],
    }));
  });

  router.get('/api/logistics/activity', requireDemoSession, requireDemoRole('logistics'), (_req: AuthenticatedRequest, res: Response) => {
    res.status(200).json(makeSuccessEnvelope({
      assignedActiveJobs: [],
      completedHistoryJobs: [],
    }));
  });

  router.get('/api/orders', requireDemoSession, (req: AuthenticatedRequest, res: Response) => {
    const role = req.demoSession?.role;
    if (!role) {
      res.status(401).json(makeErrorEnvelope('invalid_session', 'No role found.'));
      return;
    }

    res.status(200).json(makeSuccessEnvelope({
      orders: [],
      role,
    }));
  });

  router.get('/api/orders/:orderId', requireDemoSession, (req: Request, res: Response) => {
    const orderId = String(req.params.orderId ?? '');
    if (!orderId || orderId === 'undefined') {
      res.status(400).json(makeErrorEnvelope('bad_input', 'An order id is required.'));
      return;
    }

    res.status(200).json(makeSuccessEnvelope({
      order: {
        id: orderId,
        sourceType: 'auction',
        crop: 'Tomato',
        quantityKg: 500,
        unitPrice: 32,
        farmerAdvancePercent: 20,
        paymentState: 'pending',
        logisticsStatus: 'not_assigned',
        timeline: [],
      },
    }));
  });
}
