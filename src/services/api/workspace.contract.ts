import type { TradingWorkspace } from './trading.types';

type Rule = 'text' | 'number' | 'boolean' | 'date' | readonly string[] | { nullable: Rule } | { object: Shape } | { array: Rule };
type Shape = Record<string, Rule>;
const nullable = (rule: Rule): Rule => ({ nullable: rule });
const profile: Shape = {
  id: 'text', loginLabel: 'text', name: 'text', role: ['farmer', 'buyer', 'logistics'],
  trustScore: nullable('number'), completedTransactions: nullable('number'), qualityConsistency: nullable('number'),
  paymentReliability: nullable('number'), deliveryReliability: nullable('number'), verification: nullable('text'),
  location: nullable('text'), area: nullable('number'), farmerCode: nullable('text'), vehicle: nullable('text'), capacity: nullable('number'),
};
const batch: Shape = { id: 'text', farmerId: 'text', code: 'text', crop: ['Tomato', 'Onion', 'Potato'], quantityKg: 'number', grade: nullable(['A', 'B', 'C']), status: 'text' };
const kind = ['auction', 'fixed'] as const;
const list = (object: Shape): Rule => ({ array: { object } });
const workspace: Shape = {
  me: { object: profile }, profiles: list(profile), batches: list(batch),
  items: list({ id: 'text', kind, batch: { object: batch }, offeredKg: 'number', remainingKg: 'number', pricePerKg: 'number', startsAt: 'date', endsAt: 'date', status: 'text' }),
  offers: list({ id: 'text', kind, itemId: 'text', buyerId: 'text', quantityKg: 'number', remainingKg: 'number', pricePerKg: 'number', advancePercent: 'number', delivery: nullable('text'), latitude: nullable('number'), longitude: nullable('number'), status: 'text', createdAt: 'date', updatedAt: 'date' }),
  orders: list({ id: 'text', code: 'text', kind, batch: { object: batch }, buyerId: 'text', farmerId: 'text', quantityKg: 'number', pricePerKg: 'number', total: 'number', advancePercent: 'number', status: 'text', createdAt: 'date' }),
  jobs: list({ id: 'text', orderId: 'text', logisticsId: nullable('text'), status: 'text', fee: nullable('number'), feeStatus: 'text', pickup: nullable('text'), delivery: nullable('text'), crop: 'text', quantityKg: 'number', orderCode: 'text' }),
  payments: list({ id: 'text', orderId: 'text', kind: 'text', amount: 'number', status: 'text', simulated: 'boolean', paidAt: nullable('date') }),
  events: list({ id: 'text', orderId: 'text', type: 'text', createdAt: 'date' }),
  tracking: list({ id: 'text', jobId: 'text', latitude: 'number', longitude: 'number', source: ['actual', 'simulated'], recordedAt: 'date' }),
  notifications: list({ id: 'text', title: 'text', body: nullable('text'), type: 'text', entityType: nullable('text'), entityKey: nullable('text'), orderId: nullable('text'), jobId: nullable('text'), createdAt: 'date', readAt: nullable('date') }),
};

function check(value: unknown, rule: Rule, path: string): string | null {
  if (typeof rule === 'string') {
    const valid = rule === 'date' ? typeof value === 'string' && Number.isFinite(Date.parse(value))
      : rule === 'number' ? typeof value === 'number' && Number.isFinite(value)
      : typeof value === (rule === 'text' ? 'string' : 'boolean');
    return valid ? null : path;
  }
  if (Array.isArray(rule)) return rule.includes(value as string) ? null : path;
  if ('nullable' in rule) return value === null ? null : check(value, rule.nullable, path);
  if ('array' in rule) {
    if (!Array.isArray(value)) return path;
    for (let i = 0; i < value.length; i++) { const error = check(value[i], rule.array, `${path}[${i}]`); if (error) return error; }
  } else if ('object' in rule) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return path;
    for (const [key, child] of Object.entries(rule.object)) {
      const error = check((value as Record<string, unknown>)[key], child, `${path}.${key}`); if (error) return error;
    }
  }
  return null;
}

export function workspaceContractError(value: unknown): string | null {
  const error = check(value, { object: workspace }, 'workspace');
  if (error) return error;
  const data = value as TradingWorkspace;
  if (data.deliveryLocation !== undefined && data.deliveryLocation !== null) {
    return check(data.deliveryLocation, { object: { label: 'text', latitude: nullable('number'), longitude: nullable('number') } }, 'workspace.deliveryLocation');
  }
  return null;
}
export function parseWorkspace(value: unknown): TradingWorkspace {
  const field = workspaceContractError(value);
  if (field) throw new Error('Trading data is incomplete. Please retry to load your workspace.');
  return value as TradingWorkspace;
}
