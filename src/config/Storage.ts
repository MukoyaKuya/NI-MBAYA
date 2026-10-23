// Keep changes usable for this session when browser storage is unavailable.
const sessionValues = new Map<string, string | null>();

export function readStorage(key: string): string | null {
  if (sessionValues.has(key)) return sessionValues.get(key) ?? null;
  try { return globalThis.localStorage?.getItem(key) ?? null; }
  catch { return null; }
}

export function writeStorage(key: string, value: string) {
  sessionValues.set(key, value);
  try { globalThis.localStorage?.setItem(key, value); } catch { /* Session fallback remains available. */ }
}

export function removeStorage(key: string) {
  sessionValues.set(key, null);
  try { globalThis.localStorage?.removeItem(key); } catch { /* Session fallback remains available. */ }
}
