import { Redis } from '@upstash/redis';
import type { Platform } from '@/types/core';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const DEFAULT_TTL_SECONDS = 3600;

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch {
    console.warn(`[cache] getCached failed for key "${key}" — treating as cache miss`);
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds = DEFAULT_TTL_SECONDS
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    console.warn(`[cache] setCached failed for key "${key}" — fresh data still returned`);
  }
}

export function deckCacheKey(platform: Platform, deckId: string): string {
  return `deckprint:deck:${platform}:${deckId}`;
}
