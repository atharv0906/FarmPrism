import { createHash } from 'node:crypto';

import type { DemoAccountRecord, DemoRole, DemoSessionRow } from '../types/domain.js';

const demoAccounts: DemoAccountRecord[] = [
  { id: 'acc-farmer-1', loginLabel: 'farmer1', phone: '+919000000001', role: 'farmer', fullName: 'Atharva Kharat', isEnabled: true, verification: 'Verified', farmLocation: 'Pune, Maharashtra', farmArea: 5, trustScore: 88, completedTransactions: 12, qualityConsistency: 92 },
  { id: 'acc-farmer-2', loginLabel: 'farmer2', phone: '+919000000002', role: 'farmer', fullName: 'Farmer Two', isEnabled: true, verification: 'Verified', farmLocation: 'Nashik, Maharashtra', farmArea: 6, trustScore: 84, completedTransactions: 9, qualityConsistency: 89 },
  { id: 'acc-farmer-3', loginLabel: 'farmer3', phone: '+919000000003', role: 'farmer', fullName: 'Farmer Three', isEnabled: true, verification: 'Verified', farmLocation: 'Aurangabad, Maharashtra', farmArea: 4, trustScore: 80, completedTransactions: 7, qualityConsistency: 86 },
  { id: 'acc-buyer-1', loginLabel: 'buyer1', phone: '+919000000011', role: 'buyer', fullName: 'Demo Restaurant Buyer', isEnabled: true, verification: 'Verified', businessType: 'Restaurant', businessName: 'GreenTable Foods', deliveryLocation: 'Pune', trustScore: 91, completedTransactions: 18, paymentReliability: 96 },
  { id: 'acc-buyer-2', loginLabel: 'buyer2', phone: '+919000000012', role: 'buyer', fullName: 'Demo Wholesaler Buyer', isEnabled: true, verification: 'Verified', businessType: 'Wholesaler', businessName: 'Agri Bulk Network', deliveryLocation: 'Nashik', trustScore: 87, completedTransactions: 14, paymentReliability: 92 },
  { id: 'acc-buyer-3', loginLabel: 'buyer3', phone: '+919000000013', role: 'buyer', fullName: 'Demo Buyer Three', isEnabled: true, verification: 'Verified', businessType: 'Retailer', businessName: 'Fresh Basket', deliveryLocation: 'Aurangabad', trustScore: 82, completedTransactions: 11, paymentReliability: 89 },
  { id: 'acc-logistics-1', loginLabel: 'logistics1', phone: '+919000000021', role: 'logistics', fullName: 'Logistics One', isEnabled: true, verification: 'Verified', vehicle: 'Mini Truck', capacity: 1500, currentLocation: 'Pune', trustScore: 90, completedTransactions: 19, deliveryReliability: 94 },
  { id: 'acc-logistics-2', loginLabel: 'logistics2', phone: '+919000000022', role: 'logistics', fullName: 'Logistics Two', isEnabled: true, verification: 'Verified', vehicle: 'Pickup Van', capacity: 1200, currentLocation: 'Nashik', trustScore: 86, completedTransactions: 13, deliveryReliability: 91 },
  { id: 'acc-logistics-3', loginLabel: 'logistics3', phone: '+919000000023', role: 'logistics', fullName: 'Logistics Three', isEnabled: true, verification: 'Verified', vehicle: 'Truck', capacity: 2000, currentLocation: 'Aurangabad', trustScore: 89, completedTransactions: 17, deliveryReliability: 93 },
];

const inMemorySessions = new Map<string, DemoSessionRow>();

export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function getDemoAccounts(): DemoAccountRecord[] {
  return demoAccounts;
}

export function getDemoAccountByPhone(phoneValue: string): DemoAccountRecord | undefined {
  const normalized = phoneValue.trim();
  return demoAccounts.find((account) => account.phone === normalized);
}

export function getDemoAccountById(accountId: string): DemoAccountRecord | undefined {
  return demoAccounts.find((account) => account.id === accountId);
}

export function getDemoAccountByLoginLabel(loginLabel: string): DemoAccountRecord | undefined {
  return demoAccounts.find((account) => account.loginLabel === loginLabel);
}

export function createDemoSessionRow(accountId: string, rawToken: string): DemoSessionRow {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const session: DemoSessionRow = {
    id: `session-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    accountId,
    tokenHash: hashToken(rawToken),
    expiresAt,
    revokedAt: null,
    lastSeenAt: now.toISOString(),
    createdAt: now.toISOString(),
  };

  inMemorySessions.set(session.tokenHash, session);
  return session;
}

export function findActiveSessionByToken(rawToken: string): DemoSessionRow | undefined {
  const tokenHash = hashToken(rawToken);
  const session = inMemorySessions.get(tokenHash);

  if (!session) {
    return undefined;
  }

  if (session.revokedAt) {
    return undefined;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return undefined;
  }

  return session;
}

export function revokeDemoSessionByToken(rawToken: string): boolean {
  const tokenHash = hashToken(rawToken);
  const session = inMemorySessions.get(tokenHash);

  if (!session) {
    return false;
  }

  session.revokedAt = new Date().toISOString();
  return true;
}

export function updateSessionLastSeen(tokenHash: string): void {
  const session = inMemorySessions.get(tokenHash);
  if (session) {
    session.lastSeenAt = new Date().toISOString();
  }
}

export function getValidDemoRole(role: DemoRole): DemoRole {
  if (role === 'farmer' || role === 'buyer' || role === 'logistics') {
    return role;
  }

  throw new Error('Unsupported demo role.');
}
