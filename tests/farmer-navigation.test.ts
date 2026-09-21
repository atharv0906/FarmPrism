import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JsxEmit, ModuleKind, transpileModule } from 'typescript';
const require = createRequire(import.meta.url);
function load(file: string, dependencies: Record<string, unknown>) {
  const exports: Record<string, (...args: any[]) => any> = {};
  const code = transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'exports', code)((id: string) => id === 'react/jsx-runtime' ? require(id) : dependencies[id] ?? {}, exports);
  return exports;
}
const nativeStack = { createNativeStackNavigator: () => ({ Navigator: 'Navigator', Screen: 'Screen' }) };
test('tester session adapter uses web AsyncStorage and native SecureStore', async () => {
  for (const platform of ['web', 'android', 'ios']) {
    const calls: unknown[] = [];
    const adapter = (name: string) => ({
      getItem: async (key: string) => { calls.push([name, 'get', key]); return 'stored'; },
      setItem: async (key: string, value: string) => { calls.push([name, 'set', key, value]); },
      removeItem: async (key: string) => { calls.push([name, 'delete', key]); },
    });
    const web = adapter('web'), native = adapter('native');
    const mod = load('src/services/auth/sessionStorage.ts', {
      '@react-native-async-storage/async-storage': { __esModule: true, default: web }, 'react-native': { Platform: { OS: platform } },
      'expo-secure-store': { getItemAsync: native.getItem, setItemAsync: native.setItem, deleteItemAsync: native.removeItem },
    });
    const storage = mod.sessionStorage as any;
    assert.equal(await storage.getItemAsync('session'), 'stored');
    await storage.setItemAsync('session', 'test-value'); await storage.deleteItemAsync('session');
    const name = platform === 'web' ? 'web' : 'native';
    assert.deepEqual(calls, [[name, 'get', 'session'], [name, 'set', 'session', 'test-value'], [name, 'delete', 'session']]);
  }
});

test('AuthProvider passes the tester storage adapter into the existing session service', () => {
  const storage = {}, asyncStorage = {}, client = {}; let args: unknown[] = [];
  load('src/app/providers/AuthProvider.tsx', {
    '../../services/auth/sessionStorage': { sessionStorage: storage },
    '@react-native-async-storage/async-storage': { __esModule: true, default: asyncStorage },
    '../../services/api/demoSession.client': { demoSessionClient: client },
    '../../services/auth/demoSession.service': { createDemoSessionService: (...values: unknown[]) => { args = values; return {}; } },
  });
  assert.deepEqual(args, [storage, asyncStorage, client]);
});

test('ProtectedRoute preserves Splash fallback and admits only the assigned authenticated role', () => {
  for (const authenticated of [false, true]) for (const role of [null, 'farmer', 'buyer', 'logistics']) {
    const mod = load('src/navigation/ProtectedRoute.tsx', {
      '../hooks/useAuth': { useAuth: () => ({ authenticated }) },
      '../hooks/useRole': { useRole: () => ({ selectedRole: role && { code: role } }) },
      '../screens/SplashScreen': { SplashScreen: 'Splash' },
    });
    const result = mod.ProtectedRoute({ requiredRole: 'farmer', children: 'content' });
    if (authenticated && role === 'farmer') assert.equal(result, 'content');
    else assert.equal(result.type, 'Splash');
  }
});
test('Auth navigator starts fresh at Language and returning/expired sessions at Login', () => {
  for (const saved of [false, true]) {
    const mod = load('src/navigation/AuthNavigator.tsx', { '@react-navigation/native-stack': nativeStack, '../hooks/useLanguage': { useLanguage: () => ({ hasSavedLanguage: saved }) } });
    assert.equal(mod.AuthNavigator().props.initialRouteName, saved ? 'PhoneLogin' : 'LanguageSelection');
  }
});
test('App navigator gates unconfirmed roles and mounts the selected permanent role flow', () => {
  function Auth() {} function Onboarding() {}
  for (const role of [null, 'farmer', 'buyer', 'logistics']) {
    const mod = load('src/navigation/AppNavigator.tsx', {
      '../hooks/useAuth': { useAuth: () => ({ authenticated: true, loading: false, user: { id: 'account' } }) },
      '../hooks/useLanguage': { useLanguage: () => ({ loading: false }) },
      '../hooks/useRole': { useRole: () => ({ loading: false, selectedRole: role && { code: role } }) },
      '../screens/SplashScreen': { useSplashCompleted: () => true },
      './AuthNavigator': { AuthNavigator: Auth }, './OnboardingNavigator': { OnboardingNavigator: Onboarding },
    });
    const rendered = mod.AppNavigator();
    if (role === null) assert.equal(rendered.type, Onboarding);
    else { assert.equal(rendered.props.role, role); assert.equal(rendered.key, 'account'); }
  }
});
test('Farmer navigator waits for the per-account marker before choosing Personal or Dashboard', async () => {
  for (const route of ['Personal', 'Dashboard']) {
    let state: unknown = null, effect: (() => void) | undefined;
    const calls: string[] = [];
    const mod = load('src/navigation/FarmerNavigator.tsx', {
      '@react-navigation/native-stack': nativeStack,
      react: { useState: () => [state, (value: unknown) => { state = value; }], useEffect: (fn: () => void) => { effect = fn; } },
      '../hooks/useAuth': { useAuth: () => ({ demoAccount: { phone: '+919000000001', role: 'farmer' } }) },
      '../services/roles/mockFlow.service': { createMockFlowService: () => ({ farmerStart: async (phone: string) => { calls.push(phone); return route; } }) },
      '../screens/SplashScreen': { SplashScreen: 'Splash' },
    });
    assert.equal(mod.FarmerNavigator().type, 'Splash');
    effect!(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(mod.FarmerNavigator().props.initialRouteName, route);
    assert.deepEqual(calls, ['+919000000001']);
  }
});
