import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveApiBaseUrl } from '../src/services/api/api.config';

test('returns a configured API URL', () => {
  assert.equal(resolveApiBaseUrl('http://10.0.2.2:3000', {
    isDevelopment: false,
    platform: 'android',
    mockOtpEnabled: false,
  }), 'http://10.0.2.2:3000');
});

test('removes trailing slashes from a configured API URL', () => {
  assert.equal(resolveApiBaseUrl('  http://10.0.2.2:3000/// ', {
    isDevelopment: false,
    platform: 'android',
    mockOtpEnabled: false,
  }), 'http://10.0.2.2:3000');
});

test('uses the Android emulator fallback for development mock OTP', () => {
  assert.equal(resolveApiBaseUrl(undefined, {
    isDevelopment: true,
    platform: 'android',
    mockOtpEnabled: true,
  }), 'http://10.0.2.2:3000');
});

test('throws when a production API URL is missing', () => {
  assert.throws(() => resolveApiBaseUrl(undefined, {
    isDevelopment: false,
    platform: 'android',
    mockOtpEnabled: true,
  }), /FarmPrism API URL is not configured/);
});