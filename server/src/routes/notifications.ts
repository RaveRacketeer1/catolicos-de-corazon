import express from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { QuotaManager } from '../middleware/quota';
import { db } from '../index';

const router = express.Router();

/**
 * GET /api/notifications
 * Get user notifications
 */
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.uid;

    // Load notifications from Firestore
    const notificationsQuery = db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20);

    const snapshot = await notificationsQuery.get();
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    }));

    // Increment read quota
    await QuotaManager.incrementDailyQuota(userId, 'reads', 1);

    res.json({
      notifications,
    });

  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({
      error: 'Failed to load notifications',
      message: error.message,
    });
  }
});

/**
 * POST /api/notifications/preferences
 * Update notification preferences
 */
router.post('/preferences', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.uid;
    const { preferences } = req.body;

    // Update notification preferences
    await db.collection('users').doc(userId).update({
      notificationPreferences: preferences,
      lastUpdated: new Date(),
    });

    // Increment write quota
    await QuotaManager.incrementDailyQuota(userId, 'writes', 1);

    res.json({
      success: true,
      preferences,
    });

  } catch (error: any) {
    console.error('Notification preferences error:', error);
    res.status(500).json({
      error: 'Failed to update notification preferences',
      message: error.message,
    });
  }
});

/**
 * POST /api/notifications/send
 * Send push notification (admin/service endpoint)
 * Enforces batching to prevent spam
 */
router.post('/send', async (req: AuthenticatedRequest, res) => {
  try {
    const { userIds, title, body, data } = req.body;

    // TODO: Implement push notification sending
    // This would integrate with Firebase Cloud Messaging (FCM)
    // or a service like OneSignal for cross-platform notifications

    // Batch processing to prevent overwhelming the notification service
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < userIds.length; i += batchSize) {
      batches.push(userIds.slice(i, i + batchSize));
    }

    let totalSent = 0;
    for (const batch of batches) {
      // TODO: Send notifications to batch of users
      // await fcm.sendMulticast({
      //   tokens: batch,
      //   notification: { title, body },
      //   data,
      // });
      totalSent += batch.length;
    }

    res.json({
      success: true,
      totalSent,
      batchCount: batches.length,
    });

  } catch (error: any) {
    console.error('Notification send error:', error);
    res.status(500).json({
      error: 'Failed to send notifications',
      message: error.message,
    });
  }
});

export default router;