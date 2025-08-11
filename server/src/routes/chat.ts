import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AuthenticatedRequest } from '../middleware/auth';
import { QuotaManager } from '../middleware/quota';
import { db } from '../index';
import { z } from 'zod';

const router = express.Router();

// Initialize Gemini 2.5 Flash-Lite
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const model = genAI?.getGenerativeModel({ 
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    maxOutputTokens: 256, // Enforce output token limit
    temperature: 0.7,
  },
});

// Request validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1).max(2048), // Max 512 tokens ≈ 2048 chars
  sessionId: z.string().optional(),
});

/**
 * POST /api/chat
 * Send message to Gemini AI with quota enforcement
 */
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    // Validate request body
    const { message, sessionId } = chatRequestSchema.parse(req.body);
    const userId = req.user.uid;

    // Check daily AI request quota (max 3/day)
    const quotaCheck = await QuotaManager.checkQuota(userId, 'ai_request');
    if (!quotaCheck.allowed) {
      return res.status(429)
        .set({
          'X-Quota-Remaining': '0',
          'Retry-After': '86400', // 24 hours
        })
        .json({
          error: 'Daily AI quota exceeded',
          message: 'You have reached your daily limit of 3 AI requests. Quota resets tomorrow.',
          quotaType: 'ai_request',
          resetTime: quotaCheck.resetTime,
        });
    }

    // Estimate input tokens (1 token ≈ 4 characters)
    const estimatedInputTokens = Math.ceil(message.length / 4);
    if (estimatedInputTokens > 512) {
      return res.status(400).json({
        error: 'Input too long',
        message: 'Message exceeds 512 token limit. Please shorten your message.',
        maxTokens: 512,
        estimatedTokens: estimatedInputTokens,
      });
    }

    if (!model) {
      // Fallback response when Gemini is not configured
      const mockResponse = {
        response: `Mock AI response to: "${message}". Configure GEMINI_API_KEY to use real AI.`,
        tokensUsed: estimatedInputTokens + 50,
        sessionId: sessionId || `session-${Date.now()}`,
        quotaRemaining: quotaCheck.remaining - 1,
      };

      // Increment quota counter
      await QuotaManager.incrementDailyQuota(userId, 'ai_requests', 1);

      return res.json(mockResponse);
    }

    // Load conversation history for context (last 3 messages)
    const conversationHistory = await loadConversationHistory(userId, sessionId);

    // Build context prompt
    const context = conversationHistory
      .slice(-3)
      .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const fullPrompt = context 
      ? `Previous conversation:\n${context}\n\nNew message: ${message}`
      : message;

    // Generate AI response
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // Calculate actual tokens used
    const inputTokens = Math.ceil(fullPrompt.length / 4);
    const outputTokens = Math.ceil(text.length / 4);
    const tokensUsed = inputTokens + outputTokens;

    // Enforce output token limit
    let finalResponse = text;
    if (outputTokens > 256) {
      finalResponse = text.substring(0, 256 * 4) + '... [Response truncated]';
    }

    // Save conversation to Firestore
    const currentSessionId = sessionId || `session-${Date.now()}`;
    await saveConversation(userId, currentSessionId, message, finalResponse, tokensUsed);

    // Increment quotas atomically
    await Promise.all([
      QuotaManager.incrementDailyQuota(userId, 'ai_requests', 1),
      QuotaManager.incrementMonthlyTokens(userId, tokensUsed),
    ]);

    // Get remaining quota for response headers
    const remainingQuota = await QuotaManager.checkQuota(userId, 'ai_request');

    res.set({
      'X-Quota-Remaining': remainingQuota.remaining.toString(),
    });

    res.json({
      response: finalResponse,
      tokensUsed,
      sessionId: currentSessionId,
      quotaRemaining: remainingQuota.remaining,
    });

  } catch (error: any) {
    console.error('Chat error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.errors[0].message,
      });
    }

    res.status(500).json({
      error: 'Chat service error',
      message: 'Failed to generate AI response. Please try again.',
    });
  }
});

/**
 * GET /api/chat/history
 * Get chat history for user
 */
router.get('/history', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user.uid;
    const sessionId = req.query.sessionId as string;

    // Load chat history from Firestore
    const messages = await loadConversationHistory(userId, sessionId, 20);

    // Get daily requests used
    const quotaUsage = await QuotaManager.checkQuota(userId, 'ai_request');
    const dailyRequestsUsed = 3 - quotaUsage.remaining;

    res.json({
      messages: messages.reverse(), // Return in chronological order
      dailyRequestsUsed,
    });

  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      error: 'Failed to load chat history',
    });
  }
});

/**
 * Load conversation history from Firestore
 */
async function loadConversationHistory(
  userId: string, 
  sessionId?: string, 
  limit: number = 10
): Promise<any[]> {
  try {
    let query = db.collection('chatMessages')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (sessionId) {
      query = query.where('sessionId', '==', sessionId);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate(),
    }));
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
}

/**
 * Save conversation to Firestore
 */
async function saveConversation(
  userId: string,
  sessionId: string,
  userMessage: string,
  aiResponse: string,
  tokensUsed: number
): Promise<void> {
  try {
    const batch = db.batch();
    const timestamp = new Date();

    // Save user message
    const userMessageRef = db.collection('chatMessages').doc();
    batch.set(userMessageRef, {
      userId,
      sessionId,
      content: userMessage,
      isUser: true,
      timestamp,
    });

    // Save AI response
    const aiMessageRef = db.collection('chatMessages').doc();
    batch.set(aiMessageRef, {
      userId,
      sessionId,
      content: aiResponse,
      isUser: false,
      timestamp: new Date(timestamp.getTime() + 1000), // 1 second later
      tokensUsed,
    });

    await batch.commit();

    // Increment Firestore write quota (2 writes)
    await QuotaManager.incrementDailyQuota(userId, 'writes', 2);

  } catch (error) {
    console.error('Error saving conversation:', error);
    // Don't throw - conversation can continue even if save fails
  }
}

export default router;