/** Browser storage may be unavailable in private mode or embedded previews. */
const memory = new Map();

export const safeStorage = {
  getItem(key) {
    try {
      const storage = globalThis.localStorage;
      return storage ? storage.getItem(key) : (memory.get(key) ?? null);
    } catch {
      return memory.get(key) ?? null;
    }
  },
  setItem(key, value) {
    memory.set(key, value);
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* Session-only fallback. */
    }
  },
  removeItem(key) {
    memory.delete(key);
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* Storage is unavailable. */
    }
  },
};
