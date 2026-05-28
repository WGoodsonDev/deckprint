import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const DEFAULT_TTL_SECONDS = 3600;

export async function getCached<T>(key: string): Promise<T | null> {
  const value = await redis.get<T>(key);
  return value ?? null;
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<void> {
  await redis.set(key, value, { ex: ttlSeconds });
}

export function deckCacheKey(platform: string, deckId: string): string {
  return `deckprint:deck:${platform}:${deckId}`;
}
