export type ApiClientOptions = {
  baseUrl?: string;
  bearerToken?: string;
};

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
let currentDemoApiToken: string | null = null;
let unauthorized: (() => void) | null = null;
export function onApiUnauthorized(handler: (() => void) | null) { unauthorized = handler; }
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

export function setCurrentDemoApiToken(token: string | null) {
  currentDemoApiToken = token ?? null;
}

export function getCurrentDemoApiToken() {
  return currentDemoApiToken;
}

export async function apiRequest<T>(path: string, options: { method?: 'GET' | 'POST'; body?: unknown; bearerToken?: string; headers?: Record<string, string> } = {}): Promise<T> {
  const baseUrl = options.headers?.['x-api-base-url'] ?? DEFAULT_BASE_URL;
  const resolvedBearerToken = options.bearerToken ?? currentDemoApiToken;
  if (!baseUrl) throw new ApiError(503, 'API_NOT_CONFIGURED', 'The API address is not configured. Set EXPO_PUBLIC_API_URL and restart the app.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  const response = await fetch(`${baseUrl}${path}`, {
    signal: controller.signal,
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(resolvedBearerToken ? { Authorization: `Bearer ${resolvedBearerToken}` } : {}),
      ...(options.headers ?? {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  }).finally(() => clearTimeout(timeout));

  const payload = (await response.json().catch(() => null)) as T | { error?: { code?: string; message?: string } } | null;

  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload ? payload.error : undefined;
    if (response.status === 401 && resolvedBearerToken === currentDemoApiToken) unauthorized?.();
    throw new ApiError(response.status, error?.code ?? 'REQUEST_FAILED', error?.message ?? 'Request failed.');
  }

  return payload as T;
}

export const apiClient = {
  get<T>(path: string, options: { bearerToken?: string; headers?: Record<string, string> } = {}) {
    return apiRequest<T>(path, { method: 'GET', ...options });
  },
  post<T>(path: string, body: unknown, options: { bearerToken?: string; headers?: Record<string, string> } = {}) {
    return apiRequest<T>(path, { method: 'POST', body, ...options });
  },
};
