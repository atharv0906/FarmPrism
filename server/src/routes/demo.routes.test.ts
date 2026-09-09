import test from 'node:test';
import assert from 'node:assert/strict';

import { isSixDigitOtp, parseBearerToken } from '../utils/validation.js';
import { hashToken } from '../lib/demoStore.js';

test('OTP validation rejects non-six-digit values', () => {
  assert.equal(isSixDigitOtp('12345'), false);
  assert.equal(isSixDigitOtp('123456'), true);
});

test('bearer parsing strips the scheme and returns the raw token', () => {
  assert.equal(parseBearerToken('Bearer demo-token-123'), 'demo-token-123');
  assert.equal(parseBearerToken(undefined), null);
});

test('token hashing is deterministic and never stores the raw token value', () => {
  const raw = 'demo-token-123';
  const hashed = hashToken(raw);
  assert.equal(typeof hashed, 'string');
  assert.notEqual(hashed, raw);
  assert.equal(hashToken(raw), hashed);
});
