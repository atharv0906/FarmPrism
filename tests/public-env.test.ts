import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('../server/node_modules/typescript');
const source = readFileSync(new URL('../src/config/env.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

test('mobile prefers publishable key and falls back to anon for missing or blank template values', () => {
  for (const [publishable, expected] of [[' publishable ', 'publishable'], [undefined, 'legacy'], ['', 'legacy'], ['  ', 'legacy']]) {
    const exports: { publicEnv?: { supabasePublicKey: string } } = {};
    runInNewContext(compiled, { exports, __DEV__: true, process: { env: {
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishable, EXPO_PUBLIC_SUPABASE_ANON_KEY: ' legacy ',
    } } });
    assert.equal(exports.publicEnv?.supabasePublicKey, expected);
  }
});
