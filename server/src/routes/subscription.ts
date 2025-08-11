import express from 'express';
import Stripe from 'stripe';
import { AuthenticatedRequest } from '../middleware/auth';
import { db } from '../index';

const router = express.Router();

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    })
  : null;

// Subscription tiers and pricing
const SUBSCRIPTION_PLANS = {
  premium_monthly: {
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
    name: 'Premium Monthly',
    amount: 999, // $9.99
    interval: 'month',
    tokenLimit: 100000,
  },
  premium_yearly: {
    priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly',
    name: 'Premium Yearly',
    amount: 9999, // $99.99
    interval: 'year',
    tokenLimit: 100000,
  },
};

/**
 * POST /api/subscribe
 * Create Stripe Checkout session
 */
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.uid;

    if (!stripe) {
      return res.status(503).json({
        error: 'Payment service unavailable',
        message: 'Stripe is not configured. Please contact support.',
      });
    }

    // Validate price ID
    const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.priceId === priceId);
    if (!plan) {
      return res.status(400).json({
        error: 'Invalid price ID',
        message: 'The selected plan is not available.',
      });
    }

    // Get or create Stripe customer
    const user = await db.collection('users').doc(userId).get();
    const userData = user.data();
    
    let customerId = userData?.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: {
          firebaseUid: userId,
        },
      });
      customerId = customer.id;
      
      // Save customer ID to Firestore
      await db.collection('users').doc(userId).update({
        stripeCustomerId: customerId,
      });
    }

    // Create Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription`,
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
        metadata: {
          firebaseUid: userId,
          plan: plan.name,
        },
      },
    });

    res.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      clientSecret: session.client_secret, // For mobile payment sheets
    });

  } catch (error: any) {
    console.error('Subscription creation error:', error);
    res.status(500).json({
      error: 'Subscription creation failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/subscription/status
 * Get current subscription status with caching
 */
router.get('/status', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.uid;
    const cacheKey = `subscription:${userId}`;
    
    // Check cache first (60s TTL)
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    }

    // Load from Firestore
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    let subscriptionData = null;

    // Load Stripe subscription if customer exists
    if (stripe && userData.stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: userData.stripeCustomerId,
          status: 'all',
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          subscriptionData = {
            tier: subscription.metadata.plan || 'premium',
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            priceId: subscription.items.data[0].price.id,
            amount: subscription.items.data[0].price.unit_amount,
            currency: subscription.items.data[0].price.currency,
            interval: subscription.items.data[0].price.recurring?.interval,
          };
        }
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError);
      }
    }

    // Get token usage
    const tokenUsage = await QuotaManager.getMonthlyTokenUsage(userId);

    const responseData = {
      subscription: subscriptionData,
      usage: tokenUsage,
    };

    // Cache for 60 seconds
    if (redis) {
      await redis.setex(cacheKey, 60, JSON.stringify(responseData));
    }

    res.json(responseData);

  } catch (error: any) {
    console.error('Subscription status error:', error);
    res.status(500).json({
      error: 'Failed to load subscription status',
      message: error.message,
    });
  }
});

/**
 * POST /api/subscription/portal
 * Create Stripe Customer Portal session
 */
router.post('/portal', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.uid;

    if (!stripe) {
      return res.status(503).json({
        error: 'Payment service unavailable',
      });
    }

    // Get user's Stripe customer ID
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const customerId = userData?.stripeCustomerId;

    if (!customerId) {
      return res.status(400).json({
        error: 'No subscription found',
        message: 'You don\'t have an active subscription to manage.',
      });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CLIENT_URL}/subscription`,
    });

    res.json({
      url: session.url,
    });

  } catch (error: any) {
    console.error('Customer portal error:', error);
    res.status(500).json({
      error: 'Failed to create customer portal session',
      message: error.message,
    });
  }
});

export default router;