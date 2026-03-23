// Simple in-memory rate limiter for AI endpoints
// In production, use Redis or a proper rate limiter like upstash/ratelimit

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
            resetIn: record.resetAt - now 
        };
    }

    record.count++;
    return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetAt - now };
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
        if (now > value.resetAt) requestCounts.delete(key);
    }
}, 5 * 60 * 1000);
