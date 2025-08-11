// API Service Configuration and Types

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.catholic-ai.app';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

interface TokenUsage {
  current: number;
  limit: number;
  resetDate: string;
}

export class ApiService {
  private static instance: ApiService;
  private baseURL: string;
  private authToken: string | null = null;

  private constructor() {
    this.baseURL = API_BASE_URL;
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication
  async signInWithApple(token: string) {
    return this.request<{ user: any; tokens: any }>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async signInWithGoogle(token: string) {
    return this.request<{ user: any; tokens: any }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async refreshToken(refreshToken: string) {
    return this.request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // AI Services
  async generatePersonalizedPrayer(intent: {
    category: string;
    personalContext?: string;
    liturgicalContext?: any;
  }) {
    return this.request<{
      prayer: {
        title: string;
        content: string;
        source?: string;
        tokensUsed: number;
      };
    }>('/ai/prayer', {
      method: 'POST',
      body: JSON.stringify(intent),
    });
  }

  async sendChatMessage(message: string, sessionId?: string) {
    return this.request<{
      response: string;
      sources: string[];
      tokensUsed: number;
      sessionId: string;
      confidence: number;
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  }

  async getTokenUsage() {
    return this.request<TokenUsage>('/user/tokens');
  }

  // Liturgical Services
  async getTodaysReadings(date?: string) {
    const queryParam = date ? `?date=${date}` : '';
    return this.request<{
      readings: {
        firstReading: any;
        psalm: any;
        secondReading?: any;
        gospel: any;
      };
      liturgicalInfo: any;
      saints: any[];
    }>(`/liturgy/readings${queryParam}`);
  }

  async getSaintOfDay(date?: string) {
    const queryParam = date ? `?date=${date}` : '';
    return this.request<{
      saints: any[];
    }>(`/liturgy/saints${queryParam}`);
  }

  async getLiturgicalCalendar(year?: number) {
    const queryParam = year ? `?year=${year}` : '';
    return this.request<{
      calendar: any[];
    }>(`/liturgy/calendar${queryParam}`);
  }

  // Community Services
  async getPrayerIntentions(category?: string) {
    const queryParam = category ? `?category=${category}` : '';
    return this.request<{
      intentions: any[];
    }>(`/community/intentions${queryParam}`);
  }

  async addPrayerIntention(intention: {
    content: string;
    category: string;
    isAnonymous: boolean;
  }) {
    return this.request<{
      intention: any;
    }>('/community/intentions', {
      method: 'POST',
      body: JSON.stringify(intention),
    });
  }

  async prayForIntention(intentionId: string) {
    return this.request<{
      success: boolean;
    }>(`/community/intentions/${intentionId}/pray`, {
      method: 'POST',
    });
  }

  async getCommunityGroups() {
    return this.request<{
      groups: any[];
    }>('/community/groups');
  }

  // User Profile
  async getUserProfile() {
    return this.request<{
      user: any;
      preferences: any;
      stats: any;
    }>('/user/profile');
  }

  async updateUserPreferences(preferences: any) {
    return this.request<{
      preferences: any;
    }>('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async getUserStats() {
    return this.request<{
      prayersGenerated: number;
      chatSessions: number;
      tokensUsed: number;
      dayStreak: number;
    }>('/user/stats');
  }

  // Subscription Management
  async getSubscriptionStatus() {
    return this.request<{
      subscription: {
        tier: string;
        status: string;
        renewalDate: string;
        cost: string;
      };
    }>('/user/subscription');
  }

  async updateSubscription(subscriptionData: any) {
    return this.request<{
      subscription: any;
    }>('/user/subscription', {
      method: 'PUT',
      body: JSON.stringify(subscriptionData),
    });
  }
}

// Singleton instance
export const api = ApiService.getInstance();

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error.response) {
    return new ApiError(
      error.response.data?.message || 'API request failed',
      error.response.status,
      error.response.data?.code
    );
  }

  if (error.request) {
    return new ApiError('Network error - please check your connection');
  }

  return new ApiError(error.message || 'Unknown error occurred');
};