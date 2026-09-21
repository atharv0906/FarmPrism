import test from 'node:test';
import assert from 'node:assert/strict';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'unit-test-key';
const { createMutationService } = await import('./mutation.service.js');
const id = '00000000-0000-4000-8000-000000000001';
const actor = { accountId: id, role: 'farmer' as const };

test('deployed quality RPC response maps persisted notes/status to mobile contract', async () => {
  for (const grade of ['A', 'B', 'C'] as const) {
    const service = createMutationService(async () => ({ batchId: id, qualityGrade: grade, qualitySource: 'farmer_declared' }), undefined,
      async (batchId, owner) => {
        assert.equal(batchId, id); assert.equal(owner, actor.accountId);
        return { batchId, grade, notes: 'trimmed persisted notes', status: 'available' };
      });
    const result = await service.execute('setBatchQuality', actor, id, { grade, notes: '  submitted notes  ' });
    assert.deepEqual(result, { batchId: id, grade, notes: 'trimmed persisted notes', status: 'available' });
  }
});
test('quality adapter rejects malformed responses and preserves read failures', async () => {
  const service = createMutationService(async () => ({ batchId: id, qualityGrade: 'D', qualitySource: 'farmer_declared' }));
  await assert.rejects(service.execute('setBatchQuality', actor, id, { grade: 'A' }), { code: 'QUALITY_RESPONSE_INVALID' });
  const failedRead = createMutationService(async () => ({ batchId: id, qualityGrade: 'A', qualitySource: 'farmer_declared' }), undefined,
    async () => { throw new Error('Read unavailable'); });
  await assert.rejects(failedRead.execute('setBatchQuality', actor, id, { grade: 'A' }), /Read unavailable/);
});
