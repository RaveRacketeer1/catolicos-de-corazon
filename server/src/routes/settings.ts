import express from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { QuotaManager } from '../middleware/quota';
import { db } from '../index';
import { z } from 'zod';

const router = express.Router();

// Settings validation schema
const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  language: z.string().optional(),
  notifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

/**
 * POST /api/settings
 * Update user settings (counts toward write quota)
 */
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.uid;
    
    // Validate settings
    const settings = settingsSchema.parse(req.body);

    // Update user preferences in Firestore
    await db.collection('users').doc(userId).update({
      preferences: settings,
      lastUpdated: new Date(),
    });

    // Increment write quota
    await QuotaManager.incrementDailyQuota(userId, 'writes', 1);

    res.json({
      success: true,
      settings,
    });

  } catch (error: any) {
    console.error('Settings update error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid settings',
        message: error.errors[0].message,
      });
    }

    res.status(500).json({
      error: 'Failed to update settings',
      message: error.message,
    });
  }
});

/**
 * GET /api/settings
 * Get user settings
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.uid;

    // Load user preferences
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Increment read quota
    await QuotaManager.incrementDailyQuota(userId, 'reads', 1);

    res.json({
      settings: userData.preferences || {},
    });

  } catch (error: any) {
    console.error('Settings fetch error:', error);
    res.status(500).json({
      error: 'Failed to load settings',
      message: error.message,
    });
  }
});

export default router;