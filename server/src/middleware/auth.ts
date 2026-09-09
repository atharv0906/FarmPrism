import type { NextFunction, Request, Response } from 'express';

import {
  findActiveSessionByToken,
  getDemoAccountById,
  updateSessionLastSeen,
} from '../lib/demoStore.js';
import type { DemoAccountRecord, DemoRole, DemoSessionAccount } from '../types/domain.js';
import { makeErrorEnvelope, parseBearerToken } from '../utils/validation.js';

export type AuthenticatedRequest = Request & {
  demoSession?: DemoSessionAccount;
  demoAccount?: DemoAccountRecord;
};

export async function loadDemoSessionFromAuthorization(authorizationHeader: string | undefined): Promise<DemoSessionAccount | null> {
  const rawToken = parseBearerToken(authorizationHeader);
  if (!rawToken) {
    return null;
  }

  const session = await findActiveSessionByToken(rawToken);
  if (!session) {
    return null;
  }

  const account = await getDemoAccountById(session.accountId);
  if (!account || !account.isEnabled) {
    return null;
  }

  await updateSessionLastSeen(session.tokenHash);

  const safeSession: DemoSessionAccount = {
    loginLabel: account.loginLabel,
    phone: account.phone,
    role: account.role,
    fullName: account.fullName,
    verification: account.verification ?? null,
    farmLocation: account.farmLocation ?? null,
    farmArea: account.farmArea ?? null,
    businessType: account.businessType ?? null,
    businessName: account.businessName ?? null,
    deliveryLocation: account.deliveryLocation ?? null,
    vehicle: account.vehicle ?? null,
    capacity: account.capacity ?? null,
    currentLocation: account.currentLocation ?? null,
    trustScore: account.trustScore ?? null,
    completedTransactions: account.completedTransactions ?? null,
    qualityConsistency: account.qualityConsistency ?? null,
    paymentReliability: account.paymentReliability ?? null,
    deliveryReliability: account.deliveryReliability ?? null,
  };

  return safeSession;
}

export function requireDemoSession(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  void (async () => {
    try {
      const session = await loadDemoSessionFromAuthorization(req.headers.authorization);
      if (!session) {
        res.status(401).json(makeErrorEnvelope('invalid_session', 'Missing or invalid demo session.'));
        return;
      }

      req.demoSession = session;
      req.demoAccount = {
        id: '',
        loginLabel: session.loginLabel,
        phone: session.phone,
        role: session.role,
        fullName: session.fullName,
        isEnabled: true,
      };
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected session error.';
      res.status(500).json(makeErrorEnvelope('server_error', message));
    }
  })();
}

export function requireDemoRole(role: DemoRole) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.demoSession || req.demoSession.role !== role) {
      res.status(403).json(makeErrorEnvelope('forbidden', `This endpoint requires the ${role} role.`));
      return;
    }

    next();
  };
}
