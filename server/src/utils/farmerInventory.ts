export const terminalBatchStatuses = ['sold', 'completed', 'cancelled'] as const;
export const isCurrentBatch = (batch: { remainingKg: number; status: string }) =>
  batch.remainingKg > 0 && !terminalBatchStatuses.some(status => status === batch.status);
export const isSellableBatch = (batch: { remainingKg: number; status: string }) =>
  batch.remainingKg > 0 && batch.status === 'available';
