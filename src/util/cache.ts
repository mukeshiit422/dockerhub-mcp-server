import { LRUCache } from "lru-cache";

const short = Number(process.env.CACHE_TTL_SHORT || 60);
const medium = Number(process.env.CACHE_TTL_MEDIUM || 600);
const long = Number(process.env.CACHE_TTL_LONG || 3600);

export const caches = {
  short: new LRUCache<string, any>({ max: 1000, ttl: short * 1000 }),
  medium: new LRUCache<string, any>({ max: 2000, ttl: medium * 1000 }),
  long: new LRUCache<string, any>({ max: 5000, ttl: long * 1000 })
};

export async function memo<T>(bucket: keyof typeof caches, key: string, fn: () => Promise<T>): Promise<T> {
  const c = caches[bucket];
  if (c.has(key)) return c.get(key) as T;
  const val = await fn();
  c.set(key, val);
  return val;
}
