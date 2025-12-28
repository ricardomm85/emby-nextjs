/**
 * Simple in-memory rate limiter
 * Note: In production with multiple instances, use a distributed solution like Vercel KV
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Simple IP-based rate limiter
 * @param identifier - Unique identifier (typically IP)
 * @param maxRequests - Maximum number of requests
 * @param windowMs - Time window in milliseconds
 * @returns {allowed: boolean, remaining: number, resetTime: number}
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute default
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    const resetTime = now + windowMs;
    rateLimitMap.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }

  if (entry.count >= maxRequests) {
    // Limit exceeded
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  // Increment counter
  entry.count++;
  rateLimitMap.set(identifier, entry);
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}

/**
 * Get request identifier (IP or fallback)
 */
export function getRequestIdentifier(request: Request): string {
  // Try to get real IP from request
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback: use User-Agent + simple hash
  const userAgent = request.headers.get("user-agent") || "unknown";
  return `fallback-${userAgent.substring(0, 50)}`;
}
