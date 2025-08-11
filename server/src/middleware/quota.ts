import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { redis, db } from '../index';

/**
 * COST CONTROL DEFAULTS
 * These limits prevent runaway costs and ensure sustainable operation
 */
export const QUOTA_LIMITS = {
  // Firestore operations per day per user
  FIRESTORE_READS_DAILY: 30,
  FIRESTORE_WRITES_DAILY: 5,
  
  // Storage per user (bytes)
  STORAGE_LIMIT: 2 * 1024 * 1024, // 2 MB
  
  // AI quotas per day per user
  AI_REQUESTS_DAILY: 3,
  AI_INPUT_TOKENS_MAX: 512,
  AI_OUTPUT_TOKENS_MAX: 256,
  
  // Monthly token limits by subscription tier
  MONTHLY_TOKENS: {
    free: 10000,
    premium: 100000,
    enterprise: 500000,
  },
};

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
 * Atomic increment operations for daily/monthly quotas
 */
export class QuotaManager {
  /**
   * Redis atomic increment with expiration
   * Example: Daily AI requests counter
   */
  static async incrementDailyQuota(
    userId: string, 
    quotaType: 'reads' | 'writes' | 'ai_requests',
    amount: number = 1
  ): Promise<{ current: number; limit: number; remaining: number }> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `quota:daily:${userId}:${quotaType}:${today}`;
    
    let current: number;
    
    if (redis) {
      // Redis atomic increment
      current = await redis.incrBy(key, amount);
      if (current === amount) {
        // Set expiration to end of day
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const ttl = Math.floor((tomorrow.getTime() - Date.now()) / 1000);
        await redis.expire(key, ttl);
      }
    } else {
      // Firestore fallback with transaction
      const docRef = db.collection('quotas').doc(`${userId}_${today}`);
      
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const data = doc.exists ? doc.data() : {};
        current = (data?.[quotaType] || 0) + amount;
        
        transaction.set(docRef, {
          ...data,
          [quotaType]: current,
          lastUpdated: new Date(),
        }, { merge: true });
      });
    }
    
    const limits = {
      reads: QUOTA_LIMITS.FIRESTORE_READS_DAILY,
      writes: QUOTA_LIMITS.FIRESTORE_WRITES_DAILY,
      ai_requests: QUOTA_LIMITS.AI_REQUESTS_DAILY,
    };
    
    const limit = limits[quotaType];
    
    return {
      current,
      limit,
      remaining: Math.max(0, limit - current),
    };
  }

  /**
   * Monthly token counter with atomic increment
   * Example usage for tracking Gemini token consumption
   */
  static async incrementMonthlyTokens(
    userId: string,
    tokens: number
  ): Promise<{ current: number; limit: number; remaining: number }> {
    const month = new Date().toISOString().substring(0, 7); // YYYY-MM
    const key = `quota:monthly:${userId}:tokens:${month}`;
    
    let current: number;
    
    if (redis) {
      // Redis atomic increment
      current = await redis.incrBy(key, tokens);
      if (current === tokens) {
        // Set expiration to end of month
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(1);
        nextMonth.setHours(0, 0, 0, 0);
        const ttl = Math.floor((nextMonth.getTime() - Date.now()) / 1000);
        await redis.expire(key, ttl);
      }
    } else {
      // Firestore fallback
      const docRef = db.collection('monthlyQuotas').doc(`${userId}_${month}`);
      
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const data = doc.exists ? doc.data() : {};
        current = (data?.tokens || 0) + tokens;
        
        transaction.set(docRef, {
          tokens: current,
          lastUpdated: new Date(),
        }, { merge: true });
      });
    }
    
    // Get user's subscription tier to determine limit
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const tier = userData?.subscriptionTier || 'free';
    const limit = QUOTA_LIMITS.MONTHLY_TOKENS[tier as keyof typeof QUOTA_LIMITS.MONTHLY_TOKENS];
    
    return {
      current,
      limit,
      remaining: Math.max(0, limit - current),
    };
  }

  /**
   * Check if user has quota remaining for operation
   */
  static async checkQuota(
    userId: string,
    operation: 'read' | 'write' | 'ai_request' | 'monthly_tokens',
    amount: number = 1
  ): Promise<{ allowed: boolean; remaining: number; resetTime?: Date }> {
    try {
      if (operation === 'monthly_tokens') {
        const usage = await this.getMonthlyTokenUsage(userId);
        return {
          allowed: usage.remaining >= amount,
          remaining: usage.remaining,
        };
      }
      
      const quotaType = operation === 'read' ? 'reads' : 
                       operation === 'write' ? 'writes' : 'ai_requests';
      
      const today = new Date().toISOString().split('T')[0];
      const key = `quota:daily:${userId}:${quotaType}:${today}`;
      
      let current = 0;
      
      if (redis) {
        current = parseInt(await redis.get(key) || '0');
      } else {
        const docRef = db.collection('quotas').doc(`${userId}_${today}`);
        const doc = await docRef.get();
        current = doc.exists ? (doc.data()?.[quotaType] || 0) : 0;
      }
      
      const limits = {
        reads: QUOTA_LIMITS.FIRESTORE_READS_DAILY,
        writes: QUOTA_LIMITS.FIRESTORE_WRITES_DAILY,
        ai_requests: QUOTA_LIMITS.AI_REQUESTS_DAILY,
      };
      
      const limit = limits[quotaType];
      const remaining = Math.max(0, limit - current);
      
      return {
        allowed: remaining >= amount,
        remaining,
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      };
    } catch (error) {
      console.error('Quota check error:', error);
      return { allowed: false, remaining: 0 };
    }
  }

  /**
   * Get monthly token usage for user
   */
  static async getMonthlyTokenUsage(userId: string): Promise<{
    current: number;
    limit: number;
    remaining: number;
    resetDate: Date;
  }> {
    const month = new Date().toISOString().substring(0, 7);
    const key = `quota:monthly:${userId}:tokens:${month}`;
    
    let current = 0;
    
    if (redis) {
      current = parseInt(await redis.get(key) || '0');
    } else {
      const docRef = db.collection('monthlyQuotas').doc(`${userId}_${month}`);
      const doc = await docRef.get();
      current = doc.exists ? (doc.data()?.tokens || 0) : 0;
    }
    
    // Get user's subscription tier
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const tier = userData?.subscriptionTier || 'free';
    const limit = QUOTA_LIMITS.MONTHLY_TOKENS[tier as keyof typeof QUOTA_LIMITS.MONTHLY_TOKENS];
    
    // Calculate reset date (first day of next month)
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    resetDate.setDate(1);
    resetDate.setHours(0, 0, 0, 0);
    
    return {
      current,
      limit,
      remaining: Math.max(0, limit - current),
      resetDate,
    };
  }
}

/**
 * Quota enforcement middleware
 * Automatically checks and enforces quotas based on route and method
 */
export const quotaMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Determine operation type based on route and method
    let operation: 'read' | 'write' | 'ai_request' = 'read';
    
    if (req.path.includes('/chat')) {
      operation = 'ai_request';
    } else if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
      operation = 'write';
    }

    // Check quota
    const quotaCheck = await QuotaManager.checkQuota(user.uid, operation);
    
    if (!quotaCheck.allowed) {
      const retryAfter = quotaCheck.resetTime 
        ? Math.ceil((quotaCheck.resetTime.getTime() - Date.now()) / 1000)
        : 86400; // 24 hours default
      
      return res.status(429)
        .set({
          'X-Quota-Remaining': '0',
          'Retry-After': retryAfter.toString(),
        })
        .json({
          error: 'Quota exceeded',
          message: `Daily ${operation} quota exceeded. Resets in ${Math.ceil(retryAfter / 3600)} hours.`,
          quotaType: operation,
          resetTime: quotaCheck.resetTime,
        });
    }

    // Add quota info to response headers
    res.set({
      'X-Quota-Remaining': quotaCheck.remaining.toString(),
    });

    next();
  } catch (error) {
    console.error('Quota middleware error:', error);
    next(error);
  }
};