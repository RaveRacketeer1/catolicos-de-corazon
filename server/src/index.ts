import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { createClient } from 'redis';

// Import routes
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import chatRoutes from './routes/chat';
import subscriptionRoutes from './routes/subscription';
import settingsRoutes from './routes/settings';
import notificationRoutes from './routes/notifications';

// Import middleware
import { rateLimitMiddleware } from './middleware/rateLimit';
import { quotaMiddleware } from './middleware/quota';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

initializeApp({
  credential: cert(firebaseConfig),
});

export const db = getFirestore();
export const auth = getAuth();

// Initialize Redis (fallback to Firestore if not available)
export let redis: any = null;
if (process.env.REDIS_URL) {
  redis = createClient({ url: process.env.REDIS_URL });
  redis.connect().catch((error: any) => {
    console.warn('Redis connection failed, using Firestore fallback:', error.message);
    redis = null;
  });
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'],
  credentials: true,
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiting
app.use(rateLimitMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    redis: redis ? 'connected' : 'disabled',
    firebase: 'connected',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/page1', authMiddleware, dashboardRoutes);
app.use('/api/chat', authMiddleware, quotaMiddleware, chatRoutes);
app.use('/api/subscribe', authMiddleware, subscriptionRoutes);
app.use('/api/subscription', authMiddleware, subscriptionRoutes);
app.use('/api/settings', authMiddleware, quotaMiddleware, settingsRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔥 Firebase: ${firebaseConfig.projectId}`);
  console.log(`📊 Redis: ${redis ? 'Connected' : 'Firestore fallback'}`);
});

export { redis }