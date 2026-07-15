import type { NextRequest } from "next/server";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitStore = Map<string, Bucket>;

type GlobalWithRateLimitStore = typeof globalThis & {
  __linventaireRateLimitStore?: RateLimitStore;
};

export type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

const globalStore = globalThis as GlobalWithRateLimitStore;
const store =
  globalStore.__linventaireRateLimitStore ??
  (globalStore.__linventaireRateLimitStore = new Map());

function getClientAddress(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address =
    forwardedFor ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown";

  return address.slice(0, 128);
}

function pruneExpiredBuckets(now: number) {
  if (store.size < 1_000) return;

  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }

  while (store.size > 10_000) {
    const oldestKey = store.keys().next().value;
    if (typeof oldestKey !== "string") break;
    store.delete(oldestKey);
  }
}

export function checkRateLimit(
  request: NextRequest,
  { keyPrefix, limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  pruneExpiredBuckets(now);

  const key = `${keyPrefix}:${getClientAddress(request)}`;
  const current = store.get(key);
  const bucket =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : current;

  bucket.count += 1;
  store.set(key, bucket);

  return {
    allowed: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)),
    resetAt: bucket.resetAt,
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt / 1_000)),
    ...(result.allowed
      ? {}
      : { "Retry-After": String(result.retryAfterSeconds) }),
  };
}

// This bounded in-memory limiter is useful for local/demo deployments. A shared
// Redis/KV limiter should replace it when the app runs on multiple instances.
