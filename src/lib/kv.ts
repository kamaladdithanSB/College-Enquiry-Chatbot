import { kv } from "@vercel/kv";

const memory = new Map<string, { value: string; expiresAt?: number }>();

function isKvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

function now() {
  return Date.now();
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (isKvConfigured()) {
    const result = await kv.get<T>(key);
    return result ?? null;
  }

  const item = memory.get(key);
  if (!item) {
    return null;
  }

  if (item.expiresAt && item.expiresAt < now()) {
    memory.delete(key);
    return null;
  }

  return JSON.parse(item.value) as T;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number) {
  if (isKvConfigured()) {
    await kv.set(key, value, { ex: ttlSeconds });
    return;
  }

  memory.set(key, {
    value: JSON.stringify(value),
    expiresAt: now() + ttlSeconds * 1000,
  });
}

export async function incrementDailyCounter(key: string): Promise<number> {
  if (isKvConfigured()) {
    const count = await kv.incr(key);
    if (count === 1) {
      await kv.expire(key, 60 * 60 * 24 * 2);
    }
    return count;
  }

  const existing = memory.get(key);
  const current = existing ? Number(JSON.parse(existing.value)) : 0;
  const next = current + 1;

  memory.set(key, {
    value: JSON.stringify(next),
    expiresAt: now() + 1000 * 60 * 60 * 24 * 2,
  });

  return next;
}
