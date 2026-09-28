import test from 'node:test';
import assert from 'node:assert/strict';
import { safeStorage } from '../src/lib/safeStorage.js';

test('session storage falls back when browser storage is blocked', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() {
      throw new Error('Storage blocked');
    },
  });
  try {
    safeStorage.setItem('test.blocked-session', 'session');
    assert.equal(safeStorage.getItem('test.blocked-session'), 'session');
    safeStorage.removeItem('test.blocked-session');
    assert.equal(safeStorage.getItem('test.blocked-session'), null);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});

test('a removed browser session is not restored from stale memory', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const entries = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key) => entries.get(key) ?? null,
      setItem: (key, value) => entries.set(key, value),
      removeItem: (key) => entries.delete(key),
    },
  });
  try {
    safeStorage.setItem('test.removed-session', 'session');
    entries.delete('test.removed-session');
    assert.equal(safeStorage.getItem('test.removed-session'), null);
    safeStorage.removeItem('test.removed-session');
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});
