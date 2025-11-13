/**
 * RATE LIMITING UTILITY
 * 
 * Implements IP-based rate limiting to prevent abuse of public edge functions.
 * Uses in-memory storage with automatic cleanup of expired entries.
 * 
 * Rate Limits:
 * - 30 requests per minute per IP address
 * - Configurable per endpoint
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory storage for rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup interval: remove expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests?: number;  // Default: 30
  windowMs?: number;      // Default: 60000 (1 minute)
}

export function checkRateLimit(
  clientIp: string,
  endpoint: string,
  config: RateLimitConfig = {}
): { allowed: boolean; resetAt?: number; remaining?: number } {
  const maxRequests = config.maxRequests || 30;
  const windowMs = config.windowMs || 60000; // 1 minute
  
  const key = `${clientIp}:${endpoint}`;
  const now = Date.now();
  
  const entry = rateLimitMap.get(key);
  
  if (!entry || entry.resetAt < now) {
    // First request or expired window - create new entry
    rateLimitMap.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }
  
  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return { allowed: false, resetAt: entry.resetAt, remaining: 0 };
  }
  
  // Increment counter
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

export function getClientIp(req: Request): string {
  // Try to get real IP from various headers (Cloudflare, nginx, etc.)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  return cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
}
