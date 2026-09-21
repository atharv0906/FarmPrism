import { randomUUID } from 'node:crypto';

const CROP_VALUES = ['Tomato', 'Onion', 'Potato'] as const;
const DAYS_VALUES = [30, 60, 90] as const;

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length > 10) {
    return `+${digits}`;
  }

  return phone.trim();
}

export function isSixDigitOtp(value: string): boolean {
  return /^\d{6}$/.test(String(value ?? '').trim());
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isCrop(value: string): value is (typeof CROP_VALUES)[number] {
  return CROP_VALUES.includes(value as (typeof CROP_VALUES)[number]);
}

export function isAllowedDays(value: number): value is (typeof DAYS_VALUES)[number] {
  return DAYS_VALUES.includes(value as (typeof DAYS_VALUES)[number]);
}

export function parseBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(headerValue.trim());
  return match ? match[1].trim() : null;
}

export function makeSuccessEnvelope<T>(data: T): { data: T } {
  return { data };
}

export function makeErrorEnvelope(code: string, message: string): { error: { code: string; message: string } } {
  return { error: { code, message } };
}

export function generateToken(): string {
  return randomUUID().replace(/-/g, '').slice(0, 32);
}
