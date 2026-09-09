export type ApiClientOptions = {
  baseUrl?: string;
  bearerToken?: string;
};

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
let currentDemoApiToken: string | null = null;

export function setCurrentDemoApiToken(token: string | null) {
  currentDemoApiToken = token ?? null;
}

export function getCurrentDemoApiToken() {
  return currentDemoApiToken;
}

export async function apiRequest<T>(path: string, options: { method?: 'GET' | 'POST'; body?: unknown; bearerToken?: string; headers?: Record<string, string> } = {}): Promise<T> {
  const baseUrl = options.headers?.['x-api-base-url'] ?? DEFAULT_BASE_URL;
  const resolvedBearerToken = options.bearerToken ?? currentDemoApiToken;
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(resolvedBearerToken ? { Authorization: `Bearer ${resolvedBearerToken}` } : {}),
      ...(options.headers ?? {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  const payload = (await response.json().catch(() => null)) as T | { error?: { code?: string; message?: string } } | null;

  if (!response.ok) {
    const error = payload && typeof payload === 'object' && 'error' in payload ? payload.error : undefined;
    throw new Error(error?.message ?? 'Request failed.');
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
