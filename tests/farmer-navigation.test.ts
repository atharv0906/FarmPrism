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
