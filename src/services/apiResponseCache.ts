/**
 * Persists API response JSON in localStorage to reduce repeat calls (TMDB / Kinopoisk).
 *
 * - Does **not** store image binaries — only structured data including poster/profile URLs or paths.
 *   Browser HTTP cache handles actual image bytes when `<img src="...">` loads.
 * - Keys are namespaced and include locale where API responses vary by language.
 * - Eviction: removes expired entries first, then oldest by expiry until under size budget.
 */

const PREFIX = 'mc-api-cache:v1:';
const MAX_STORAGE_BYTES = 3_000_000;

/** Movie / actor / credits — metadata changes rarely */
export const TTL_ENTITY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Trending / search — more dynamic */
export const TTL_LIST_MS = 24 * 60 * 60 * 1000; // 24 hours

interface Entry<T> {
  exp: number;
  v: T;
}

function safeParse<T>(raw: string | null): Entry<T> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Entry<T>;
  } catch {
    return null;
  }
}

function storageKey(fullKey: string): string {
  return `${PREFIX}${fullKey}`;
}

/**
 * Returns cached value if present and not expired.
 */
export function cacheGet<T>(fullKey: string): T | null {
  try {
    const raw = localStorage.getItem(storageKey(fullKey));
    const parsed = safeParse<T>(raw);
    if (!parsed) return null;
    if (Date.now() > parsed.exp) {
      localStorage.removeItem(storageKey(fullKey));
      return null;
    }
    return parsed.v;
  } catch {
    return null;
  }
}

function totalCacheSize(): number {
  let n = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) {
        n += (localStorage.getItem(k)?.length ?? 0) + k.length;
      }
    }
  } catch {
    // ignore
  }
  return n;
}

function collectEntries(): { key: string; exp: number; size: number }[] {
  const out: { key: string; exp: number; size: number }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const storageKeyFull = localStorage.key(i);
      if (!storageKeyFull?.startsWith(PREFIX)) continue;
      const raw = localStorage.getItem(storageKeyFull);
      if (!raw) continue;
      const parsed = safeParse<unknown>(raw);
      const exp = parsed?.exp ?? 0;
      out.push({ key: storageKeyFull, exp, size: raw.length + storageKeyFull.length });
    }
  } catch {
    // ignore
  }
  return out;
}

function evictIfNeeded(addedBytes: number): void {
  const target = MAX_STORAGE_BYTES - addedBytes;
  if (totalCacheSize() <= target) return;

  const entries = collectEntries();
  const now = Date.now();

  for (const e of entries) {
    if (e.exp < now) {
      try {
        localStorage.removeItem(e.key);
      } catch {
        // ignore
      }
    }
  }

  if (totalCacheSize() <= target) return;

  entries.sort((a, b) => a.exp - b.exp);
  for (const e of entries) {
    if (totalCacheSize() <= target) break;
    try {
      localStorage.removeItem(e.key);
    } catch {
      // ignore
    }
  }
}

/**
 * Stores a value with TTL. May evict old/expired entries if near quota.
 */
export function cacheSet<T>(fullKey: string, value: T, ttlMs: number = TTL_ENTITY_MS): void {
  const exp = Date.now() + ttlMs;
  const payload = JSON.stringify({ exp, v: value } satisfies Entry<T>);
  const sk = storageKey(fullKey);
  try {
    evictIfNeeded(payload.length + sk.length);
    localStorage.setItem(sk, payload);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      evictIfNeeded(Infinity);
      try {
        localStorage.setItem(sk, payload);
      } catch {
        // still full — skip cache
      }
    }
  }
}

/**
 * Removes one cache entry (e.g. after mutation — not used yet).
 */
export function cacheRemove(fullKey: string): void {
  try {
    localStorage.removeItem(storageKey(fullKey));
  } catch {
    // ignore
  }
}

/** Clears all persisted API entries (e.g. for tests). */
export function clearApiResponseCache(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    for (const k of keys) localStorage.removeItem(k);
  } catch {
    // ignore
  }
}
