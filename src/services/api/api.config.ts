const ANDROID_EMULATOR_API_URL = 'http://10.0.2.2:3000';
const runtimeGlobals = globalThis as typeof globalThis & { __DEV__?: boolean };

type ApiUrlResolutionOptions = {
  isDevelopment?: boolean;
  platform?: string;
  mockOtpEnabled?: boolean;
};

export function resolveApiBaseUrl(
  configuredUrl: string | undefined,
  { isDevelopment, platform, mockOtpEnabled }: ApiUrlResolutionOptions = {},
): string {
  const normalizedUrl = configuredUrl?.trim().replace(/\/+$/, '');
  if (normalizedUrl) return normalizedUrl;

  const development = isDevelopment ?? runtimeGlobals.__DEV__ === true;
  const currentPlatform = platform ?? 'unknown';
  const mockOtp = mockOtpEnabled ?? process.env.EXPO_PUBLIC_MOCK_OTP !== 'false';
  if (development && currentPlatform === 'android' && mockOtp) {
    return ANDROID_EMULATOR_API_URL;
  }

  throw new Error('FarmPrism API URL is not configured. Set EXPO_PUBLIC_API_URL and restart the app.');
}

export function getApiBaseUrl(): string {
  const nativePlatform = require('react-native') as { Platform: { OS: string } };
  const baseUrl = resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_URL, {
    platform: nativePlatform.Platform.OS,
  });
  if (runtimeGlobals.__DEV__ === true) console.info('[FarmPrism API] base URL configured');
  return baseUrl;
}