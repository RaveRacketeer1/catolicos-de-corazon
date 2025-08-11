import express from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { QuotaManager } from '../middleware/quota';
import { redis, db } from '../index';

const router = express.Router();

/**
 * GET /api/dashboard
 * Get user dashboard data with 30s cache
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.uid;
    const cacheKey = `dashboard:${userId}`;
    
    // Check cache first (30s TTL)
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    // Load user data from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current usage
    const [dailyReads, dailyWrites, dailyAI, monthlyTokens] = await Promise.all([
      QuotaManager.checkQuota(userId, 'read'),
      QuotaManager.checkQuota(userId, 'write'), 
      QuotaManager.checkQuota(userId, 'ai_request'),
      QuotaManager.getMonthlyTokenUsage(userId),
    ]);

    const dashboardData = {
      user: {
        name: userData.name,
        email: userData.email,
        subscriptionTier: userData.subscriptionTier,
        subscriptionStatus: userData.subscriptionStatus,
      },
      usage: {
        firestoreReads: 30 - dailyReads.remaining,
        firestoreWrites: 5 - dailyWrites.remaining,
        aiRequests: 3 - dailyAI.remaining,
        monthlyTokens: monthlyTokens.current,
        storageUsed: userData.storageUsed || 0,
      },
      limits: {
        dailyReads: 30,
        dailyWrites: 5,
        dailyAiRequests: 3,
        monthlyTokens: monthlyTokens.limit,
        storageLimit: 2 * 1024 * 1024, // 2MB
      },
      stats: {
        totalSessions: userData.totalSessions || 0,
        avgResponseTime: 1.2, // TODO: Calculate from metrics
        successRate: 99.1, // TODO: Calculate from error logs
      },
    };

    // Cache for 30 seconds
    if (redis) {
      await redis.setex(cacheKey, 30, JSON.stringify(dashboardData));
    }

    // Increment read quota
    await QuotaManager.incrementDailyQuota(userId, 'reads', 1);

    res.json(dashboardData);

  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load dashboard',
      message: error.message,
    });
  }
});

/**
 * GET /api/page1
 * Serve page content with 120s cache
 */
router.get('/page1', async (req: AuthenticatedRequest, res) => {
  try {
    const cacheKey = 'page1:content';
    
    // Check cache first (120s TTL)
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        // Still increment read quota even for cached content
        await QuotaManager.incrementDailyQuota(req.user.uid, 'reads', 1);
        return res.json(JSON.parse(cached));
      }
    }

    // Load content (in production, this might come from CMS)
    const content = {
      title: 'Welcome to Page 1',
      content: `This is a read-only content page that demonstrates server-side caching and quota management.

Key features:
• Server-side caching with 120s TTL
• Automatic quota counting for Firestore reads
• Clean separation of content and application logic
• Optimized for fast loading and minimal database usage

In production, this content would be:
- Fetched from a headless CMS
- Cached at multiple levels (Redis, CDN)
- Versioned for content management
- Optimized for SEO and performance`,
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 120 seconds
    if (redis) {
      await redis.setex(cacheKey, 120, JSON.stringify(content));
    }

    // Increment read quota
    await QuotaManager.incrementDailyQuota(req.user.uid, 'reads', 1);

    res.json(content);

  } catch (error: any) {
    console.error('Page1 error:', error);
    res.status(500).json({
      error: 'Failed to load content',
      message: error.message,
    });
  }
});

export default router;