import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!API_KEY || API_KEY === 'demo-gemini-key') {
  console.warn('EXPO_PUBLIC_GEMINI_API_KEY is not configured - using demo mode');
}

const genAI = API_KEY && API_KEY !== 'demo-gemini-key' ? new GoogleGenerativeAI(API_KEY) : null;

export class GeminiService {
  private model;

  constructor() {
    if (genAI) {
      // Use Gemini 2.5 Flash-Lite model
      this.model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        generationConfig: {
          maxOutputTokens: 256, // Enforce output token limit
          temperature: 0.7,
        },
      });
    }
  }

  async generateResponse(
    message: string, 
    conversationHistory: any[] = []
  ): Promise<{
    response: string;
    tokensUsed: number;
  }> {
    if (!this.model) {
      // Demo mode response
      return {
        response: `Demo response to: "${message}". Configure EXPO_PUBLIC_GEMINI_API_KEY to use real AI.`,
        tokensUsed: Math.floor(Math.random() * 200) + 50,
      };
    }

    try {
      // Validate input length (max 512 tokens ≈ 2048 characters)
      if (message.length > 2048) {
        throw new Error('Input too long. Maximum 2048 characters allowed.');
      }

      // Build conversation context (last 3 messages for efficiency)
      const context = conversationHistory
        .slice(-3)
        .map(msg => `${msg.isUser ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const fullPrompt = context 
        ? `Previous conversation:\n${context}\n\nNew message: ${message}`
        : message;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Estimate tokens used (rough calculation: 1 token ≈ 4 characters)
      const inputTokens = Math.ceil(fullPrompt.length / 4);
      const outputTokens = Math.ceil(text.length / 4);
      const tokensUsed = inputTokens + outputTokens;

      // Enforce token limits
      if (inputTokens > 512) {
        throw new Error('Input exceeds 512 token limit');
      }
      if (outputTokens > 256) {
        // Truncate response if it exceeds limit
        const truncatedText = text.substring(0, 256 * 4); // Approximate character limit
        return {
          response: truncatedText + '... [Response truncated due to token limit]',
          tokensUsed: 512 + 256, // Max tokens
        };
      }

      return {
        response: text,
        tokensUsed,
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate AI response. Please try again.');
    }
  }

  async validateInput(message: string): Promise<{
    isValid: boolean;
    error?: string;
    estimatedTokens: number;
  }> {
    const estimatedTokens = Math.ceil(message.length / 4);
    
    if (message.length === 0) {
      return {
        isValid: false,
        error: 'Message cannot be empty',
        estimatedTokens: 0,
      };
    }

    if (estimatedTokens > 512) {
      return {
        isValid: false,
        error: 'Message too long. Maximum 512 tokens (≈2048 characters) allowed.',
        estimatedTokens,
      };
    }

    return {
      isValid: true,
      estimatedTokens,
    };
  }
}

export const geminiService = new GeminiService();