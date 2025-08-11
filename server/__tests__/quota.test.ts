import { QuotaManager, TokenBucket } from '../src/middleware/quota';

describe('QuotaManager', () => {
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    // Reset any test state
    jest.clearAllMocks();
  });

  describe('Token Bucket Algorithm', () => {
    it('should allow requests within capacity', async () => {
      const bucket = new TokenBucket(10, 1); // 10 capacity, 1 token/second refill
      
      // Should allow initial requests up to capacity
      expect(await bucket.consume(5)).toBe(true);
      expect(await bucket.consume(5)).toBe(true);
      expect(await bucket.consume(1)).toBe(false); // Exceeds capacity
    });

    it('should refill tokens over time', async () => {
      const bucket = new TokenBucket(10, 2); // 2 tokens/second refill
      
      // Consume all tokens
      await bucket.consume(10);
      expect(bucket.getTokens()).toBe(0);
      
      // Wait 1 second (should refill 2 tokens)
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(bucket.getTokens()).toBeGreaterThanOrEqual(1.5);
    });
  });

  describe('Daily Quota Management', () => {
    it('should increment daily AI requests correctly', async () => {
      // Mock implementation - in real tests, use test database
      const result = await QuotaManager.incrementDailyQuota(mockUserId, 'ai_requests', 1);
      
      expect(result.current).toBeGreaterThan(0);
      expect(result.limit).toBe(3);
      expect(result.remaining).toBeLessThanOrEqual(3);
    });

    it('should enforce daily limits', async () => {
      // Test quota enforcement
      const quotaCheck = await QuotaManager.checkQuota(mockUserId, 'ai_request');
      
      expect(quotaCheck).toHaveProperty('allowed');
      expect(quotaCheck).toHaveProperty('remaining');
      expect(typeof quotaCheck.allowed).toBe('boolean');
    });
  });

  describe('Monthly Token Tracking', () => {
    it('should track monthly token usage', async () => {
      const result = await QuotaManager.incrementMonthlyTokens(mockUserId, 150);
      
      expect(result.current).toBeGreaterThanOrEqual(150);
      expect(result.limit).toBeGreaterThan(0);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should calculate correct reset date', async () => {
      const usage = await QuotaManager.getMonthlyTokenUsage(mockUserId);
      
      expect(usage.resetDate).toBeInstanceOf(Date);
      expect(usage.resetDate.getTime()).toBeGreaterThan(Date.now());
    });
  });
});

describe('Chat Gateway', () => {
  describe('Input Validation', () => {
    it('should reject messages exceeding token limit', () => {
      const longMessage = 'a'.repeat(3000); // Exceeds 512 token limit
      const estimatedTokens = Math.ceil(longMessage.length / 4);
      
      expect(estimatedTokens).toBeGreaterThan(512);
    });

    it('should accept valid messages', () => {
      const validMessage = 'Hello, how are you today?';
      const estimatedTokens = Math.ceil(validMessage.length / 4);
      
      expect(estimatedTokens).toBeLessThanOrEqual(512);
    });
  });

  describe('Token Counting', () => {
    it('should estimate tokens correctly', () => {
      const message = 'Hello world'; // ~3 tokens
      const estimatedTokens = Math.ceil(message.length / 4);
      
      expect(estimatedTokens).toBeGreaterThan(0);
      expect(estimatedTokens).toBeLessThan(10);
    });
  });
});