import express from 'express';
import { auth } from '../index';
import { authRateLimit } from '../middleware/rateLimit';

const router = express.Router();

/**
 * POST /api/auth/session
 * Create server session from Firebase ID token
 */
router.post('/session', authRateLimit, async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({
        error: 'Missing Firebase token',
        message: 'firebaseToken is required',
      });
    }

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(firebaseToken);
    
    // TODO: Create server session token (JWT)
    // const sessionToken = jwt.sign(
    //   { uid: decodedToken.uid, email: decodedToken.email },
    //   process.env.JWT_SECRET,
    //   { expiresIn: '7d' }
    // );

    // For now, return the Firebase token as session token
    const sessionToken = firebaseToken;

    res.json({
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
      },
      sessionToken,
    });

  } catch (error: any) {
    console.error('Session creation error:', error);
    res.status(401).json({
      error: 'Invalid token',
      message: 'Failed to verify Firebase token',
    });
  }
});

export default router;