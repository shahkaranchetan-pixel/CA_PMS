/**
 * In-memory rate limiter.
 *
 * ⚠️  PRODUCTION UPGRADE PATH (Point 3):
 *     This implementation resets on every serverless cold-start and does not
 *     share state across multiple instances. To get real protection on Vercel /
 *     any auto-scaling deployment, replace with:
 *       npm install @upstash/ratelimit @upstash/redis
 *     then swap this module for @upstash/ratelimit using sliding-window algo.
 *     Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env.
 */

const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
    identifier: string,
    maxRequests: number = 5,
    windowMs: number = 60 * 1000 // 1 minute
): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const record = requestCounts.get(identifier);

    if (!record || now > record.resetAt) {
        requestCounts.set(identifier, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
    }

    if (record.count >= maxRequests) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: record.resetAt - now,
        };
    }

    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetAt - now };
}

// Point 15: Store the interval reference so it can be cleared (prevents leak in long-running servers)
let _cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
    if (_cleanupInterval) return; // already running
    _cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, value] of requestCounts.entries()) {
            if (now > value.resetAt) requestCounts.delete(key);
        }
    }, 5 * 60 * 1000);

    // Allow Node.js to exit even if this interval is still pending
    if (_cleanupInterval.unref) _cleanupInterval.unref();
}

startCleanup();
