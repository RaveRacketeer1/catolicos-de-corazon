import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { redis, db } from '../index';

/**
 * Token Bucket Algorithm Implementation
 * Allows burst requests up to bucket capacity, then refills at steady rate
 */
export class TokenBucket {
  private capacity: number;
  private tokens: number;
  private refillRate: number; // tokens per second
  private lastRefill: number;

  constructor(capacity: number, refillRate: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  async consume(tokensRequested: number = 1): Promise<boolean> {
    this.refill();
    
    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true;
    }
    
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * Redis-based rate limiting with fallback to in-memory
 */
export const createRateLimiter = (
  windowMs: number,
  maxRequests: number,
  keyGenerator?: (req: Request) => string
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: keyGenerator || ((req) => req.ip),
    
    // Custom store using Redis or memory fallback
    store: redis ? {
      incr: async (key: string) => {
        const current = await redis.incr(key);
        if (current === 1) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
        }
        return { totalHits: current, resetTime: new Date(Date.now() + windowMs) };
      },
      decrement: async (key: string) => {
        await redis.decr(key);
      },
      resetKey: async (key: string) => {
        await redis.del(key);
      },
    } : undefined, // Use default memory store if Redis unavailable
    
    message: {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    },
    
    standardHeaders: true,
    legacyHeaders: false,
    
    // Add quota headers
    onLimitReached: (req: Request, res: Response) => {
      res.set({
        'X-Quota-Remaining': '0',
        'Retry-After': Math.ceil(windowMs / 1000).toString(),
      });
    },
  });
};

// Global rate limiter: 100 requests per 15 minutes per IP
export const rateLimitMiddleware = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100 // max requests
);

// API-specific rate limiters
export const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // max 5 auth attempts
  (req) => req.ip + ':auth'
);

export const chatRateLimit = createRateLimiter(
  24 * 60 * 60 * 1000, // 24 hours
  3, // max 3 chat requests per day
  (req) => (req as any).user?.uid || req.ip
);