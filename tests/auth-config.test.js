import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAuthEnvironment, safeAppRedirect } from '../src/lib/authConfig.js';

const live = {
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
};

test('demo mode must be explicit and cannot mask incomplete live config', () => {
  assert.equal(parseAuthEnvironment({}).mode, 'unconfigured');
  assert.equal(parseAuthEnvironment({ VITE_DEMO_MODE: 'true' }).mode, 'demo');
  assert.equal(parseAuthEnvironment({ VITE_DEMO_MODE: 'TRUE' }).mode, 'unconfigured');
  assert.equal(
    parseAuthEnvironment({ VITE_DEMO_MODE: 'true', VITE_SUPABASE_URL: live.VITE_SUPABASE_URL })
      .mode,
    'unconfigured',
  );
  assert.equal(parseAuthEnvironment({ VITE_DEMO_MODE: 'true', ...live }).mode, 'supabase');
});

test('live configuration rejects unsafe URLs and private keys', () => {
  assert.equal(parseAuthEnvironment(live).error, null);
  for (const url of [
    'not-a-url',
    'http://example.supabase.co',
    'https://user:pass@example.supabase.co',
    'javascript:alert(1)',
  ]) {
    assert.ok(parseAuthEnvironment({ ...live, VITE_SUPABASE_URL: url }).error);
  }
  assert.equal(
    parseAuthEnvironment({ ...live, VITE_SUPABASE_URL: 'http://127.0.0.1:54321' }).mode,
    'supabase',
  );
  assert.ok(
    parseAuthEnvironment({ ...live, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_do-not-use' }).error,
  );
  const serviceKey = `e30.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  assert.ok(parseAuthEnvironment({ ...live, VITE_SUPABASE_PUBLISHABLE_KEY: serviceKey }).error);
  const anonKey = `e30.${Buffer.from(JSON.stringify({ role: 'anon' })).toString('base64url')}.signature`;
  assert.equal(
    parseAuthEnvironment({ ...live, VITE_SUPABASE_PUBLISHABLE_KEY: anonKey }).mode,
    'supabase',
  );
});

test('post-auth destinations reject external, malformed and recursive auth redirects', () => {
  for (const value of [
    null,
    '',
    '//evil.example',
    'https://evil.example/app',
    '/\\evil.example',
    '/login',
    '/auth/callback',
    '/app/%2f%2fevil.example',
    '/app/../../login',
    '/app\n/dashboard',
    '/application',
  ]) {
    assert.equal(safeAppRedirect(value), '/app/dashboard', String(value));
  }
  assert.equal(safeAppRedirect('/app/games?language=ja#play'), '/app/games?language=ja#play');
  assert.equal(safeAppRedirect('/admin/templates'), '/admin/templates');
  assert.equal(safeAppRedirect('/auth/update-password'), '/auth/update-password');
});
