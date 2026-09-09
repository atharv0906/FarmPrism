import { ApiError } from './apiError.js';
import { isUuid } from './validation.js';

export function invalid(): never {
  throw new ApiError(400, 'INVALID_INPUT', 'Invalid or unexpected input.');
}
export function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  if (Object.keys(value).some(key => !keys.includes(key))) return invalid();
  return value as Record<string, unknown>;
}
export function uuid(value: unknown): string {
  return typeof value === 'string' && isUuid(value) ? value : invalid();
}
export function number(value: unknown, min = 0, max = Number.MAX_VALUE): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : invalid();
}
export function positive(value: unknown): number {
  const result = number(value);
  return result > 0 ? result : invalid();
}
export function text(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : invalid();
}
export function nullableText(value: unknown): string | null {
  return value == null ? null : typeof value === 'string' ? value.trim() : invalid();
}
export function boolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : invalid();
}
export function duration(value: unknown): number {
  return value === 6 || value === 12 || value === 24 ? value : invalid();
}
export function rating(value: unknown): number {
  const result = number(value, 1, 5);
  return Number.isInteger(result) ? result : invalid();
}
export function otp(value: unknown): string {
  return typeof value === 'string' && /^\d{6}$/.test(value) ? value : invalid();
}
export function grade(value: unknown): 'A' | 'B' | 'C' {
  return value === 'A' || value === 'B' || value === 'C' ? value : invalid();
}
export function source(value: unknown): 'actual' | 'simulated' {
  return value === 'actual' || value === 'simulated' ? value : invalid();
}
export function delivery(value: unknown) {
  const input = object(value, ['label', 'latitude', 'longitude']);
  return {
    p_delivery_label: text(input.label),
    p_delivery_latitude: number(input.latitude, -90, 90),
    p_delivery_longitude: number(input.longitude, -180, 180),
  };
}
