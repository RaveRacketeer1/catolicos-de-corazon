# Firebase + Stripe + Gemini App Scaffold

A complete TypeScript Expo React Native app with Firebase authentication, Stripe payments, and Gemini 2.5 Flash-Lite AI chat integration.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT (Expo React Native)                  │
├─────────────────┬─────────────────┬─────────────────┬───────────┤
│   iOS Native    │  Android Native │    Web App      │           │
│                 │                 │                 │           │
└─────────┬───────┴─────────┬───────┴─────────┬───────┴───────────┘
          │                 │                 │
┌─────────┴─────────────────┴─────────────────┴───────────────────┐
│                    SERVER GATEWAY                               │
│              (Express.js + TypeScript)                         │
│         - Rate Limiting - Auth - Quota Management              │
└─────┬───────────────┬───────────────┬───────────────┬─────────┘
      │               │               │               │
┌─────┴────┐    ┌────┴────┐    ┌────┴────┐    ┌────┴─────────┐
│ Firebase │    │ Gemini  │    │ Stripe  │    │    Redis     │
│   Auth   │    │ 2.5 FL  │    │ Billing │    │   (Cache)    │
│Firestore │    │   AI    │    │ Portal  │    │   Quotas     │
└──────────┘    └─────────┘    └─────────┘    └──────────────┘
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install client dependencies
npm install

# Install server dependencies
cd server && npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

### 3. Start Development

```bash
# Terminal 1: Start Expo client
npm run dev

# Terminal 2: Start server gateway
npm run server:dev
```

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email, Google, Apple, Facebook providers
3. Create a Firestore database
4. Generate service account key for server
5. Update `.env` and `server/.env` with your Firebase config

### Stripe Setup

1. Create a Stripe account at https://dashboard.stripe.com
2. Create products and prices for your subscription tiers
3. Set up webhook endpoints for subscription events
4. Update `.env` and `server/.env` with your Stripe keys

### Gemini AI Setup

1. Get API key from Google AI Studio
2. Update `.env` with your Gemini API key
3. Configure model parameters in `services/gemini.ts`

## 💰 Cost Control & Quotas

### Default Limits (Per User)

**Daily Quotas:**
- Firestore Reads: ≤ 30/day
- Firestore Writes: ≤ 5/day  
- AI Requests: ≤ 3/day
- Storage Limit: 2 MB per user

**AI Token Limits:**
- Input: ≤ 512 tokens per request
- Output: ≤ 256 tokens per request

**Monthly Token Limits by Tier:**
- Free: 10,000 tokens/month
- Premium: 100,000 tokens/month  
- Enterprise: 500,000 tokens/month

### Quota Enforcement

The server implements atomic quota counting using Redis (with Firestore fallback):

```typescript
// Example: Increment daily AI requests
const usage = await QuotaManager.incrementDailyQuota(userId, 'ai_requests', 1);

// Example: Check monthly token quota
const tokenQuota = await QuotaManager.checkQuota(userId, 'monthly_tokens', 150);
if (!tokenQuota.allowed) {
  return res.status(429).json({ error: 'Monthly token quota exceeded' });
}
```

### Cost Optimization Strategies

1. **Intelligent Caching**: 30s-120s TTL on frequently accessed data
2. **Token Bucket Rate Limiting**: Prevents burst usage spikes
3. **Response Truncation**: Enforces output token limits
4. **Conversation Context**: Limited to last 3 messages for efficiency
5. **Atomic Counters**: Prevents race conditions in quota tracking

### Tuning Quotas

Modify limits in `server/src/middleware/quota.ts`:

```typescript
export const QUOTA_LIMITS = {
  FIRESTORE_READS_DAILY: 30,    // Increase for heavy read apps
  FIRESTORE_WRITES_DAILY: 5,    // Increase for content creation apps
  AI_REQUESTS_DAILY: 3,         // Increase for chat-heavy apps
  AI_INPUT_TOKENS_MAX: 512,     // Max input per request
  AI_OUTPUT_TOKENS_MAX: 256,    // Max output per request
  
  MONTHLY_TOKENS: {
    free: 10000,                // Freemium tier
    premium: 100000,            // Standard paid tier
    enterprise: 500000,         // High-usage tier
  },
};
```

## 📱 App Structure

### Authentication Flow
1. **Login Screen**: Email + Social providers (Apple, Google, Facebook)
2. **Subscription Required**: Users must subscribe after authentication
3. **7-Day Free Trial**: All new users get trial access
4. **Persistent Sessions**: Firebase handles session management

### Main App (Tabs)
1. **Dashboard**: Usage metrics, subscription status, quota meters
2. **Content Page**: Read-only content with caching
3. **AI Chat**: Gemini 2.5 Flash-Lite integration with quota enforcement
4. **Settings**: Theme, language, notifications, account management

### Subscription Management
- **Stripe Checkout**: Secure payment processing
- **Customer Portal**: Self-service subscription management
- **Trial Tracking**: Automatic trial expiration handling
- **Usage Monitoring**: Real-time quota and billing tracking

## 🔒 Security Features

### Authentication
- Firebase Auth with multiple providers
- JWT token validation on server
- Secure session management
- Automatic token refresh

### Data Protection
- Firestore security rules
- Input validation and sanitization
- Rate limiting and quota enforcement
- CORS and security headers

### Cost Protection
- Atomic quota counters prevent overages
- Token bucket algorithm for burst protection
- Automatic quota resets (daily/monthly)
- Real-time usage monitoring

## 🧪 Testing

### Unit Tests

```bash
# Client tests
npm test

# Server tests
cd server && npm test
```

### Test Coverage

- Quota middleware functionality
- Chat gateway with token counting
- Authentication flows
- Subscription management
- Error handling scenarios

## 🚀 Deployment

### Client Deployment
```bash
# Build for web
npm run build:web

# Build for mobile (EAS Build)
eas build --platform all
```

### Server Deployment
```bash
# Build server
cd server && npm run build

# Deploy to Cloud Run, Railway, or similar
# Configure environment variables in production
```

### Environment Variables (Production)

**Client (.env):**
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_production_firebase_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
EXPO_PUBLIC_GEMINI_API_KEY=your_production_gemini_key
EXPO_PUBLIC_API_URL=https://your-server.com
```

**Server (.env):**
```
FIREBASE_PRIVATE_KEY="your_service_account_private_key"
STRIPE_SECRET_KEY=sk_live_your_stripe_secret
GEMINI_API_KEY=your_production_gemini_key
REDIS_URL=redis://your-redis-instance
```

## 📊 Monitoring & Analytics

### Key Metrics to Track

**Business Metrics:**
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Churn Rate
- Average Revenue Per User (ARPU)

**Technical Metrics:**
- API Response Times
- Error Rates
- Quota Utilization
- Token Consumption Patterns

**Cost Metrics:**
- Gemini API costs per user
- Firebase usage costs
- Infrastructure costs
- Cost per conversation

### Recommended Monitoring Tools

- **Application Performance**: Datadog, New Relic
- **Error Tracking**: Sentry
- **Business Analytics**: Mixpanel, Amplitude
- **Infrastructure**: CloudWatch, Grafana

## 🔄 Scaling Considerations

### Horizontal Scaling
- Stateless server design enables easy horizontal scaling
- Redis cluster for distributed quota management
- Firebase automatically scales
- CDN for static assets

### Cost Optimization at Scale
- Implement conversation caching to reduce AI costs
- Use smaller models for simple queries
- Batch operations where possible
- Implement user-based pricing tiers

### Performance Optimization
- Response caching with appropriate TTLs
- Database query optimization
- Connection pooling
- Lazy loading of non-critical features

## 📝 Development Notes

### Adding New Features
1. Update quota limits if feature uses AI/database
2. Add appropriate caching for read-heavy operations
3. Implement proper error handling and user feedback
4. Update tests for new functionality

### Modifying Quotas
1. Update `QUOTA_LIMITS` in `server/src/middleware/quota.ts`
2. Test quota enforcement in development
3. Monitor cost impact in production
4. Communicate changes to users

### Security Best Practices
1. Never expose API keys in client code
2. Validate all inputs on server side
3. Implement proper CORS policies
4. Use HTTPS in production
5. Regular security audits

## 🆘 Troubleshooting

### Common Issues

**"Firebase: Error (auth/invalid-api-key)"**
- Check Firebase configuration in `.env`
- Ensure API key is valid and project exists

**"Quota exceeded" errors**
- Check current usage in dashboard
- Verify quota limits are appropriate
- Consider upgrading subscription tier

**Stripe payment failures**
- Verify Stripe keys are correct
- Check webhook configuration
- Test in Stripe test mode first

**AI responses not working**
- Verify Gemini API key is configured
- Check quota limits haven't been exceeded
- Monitor server logs for detailed errors

### Support

For technical support:
1. Check server logs for detailed error messages
2. Verify all environment variables are configured
3. Test individual components in isolation
4. Contact support with specific error messages and steps to reproduce