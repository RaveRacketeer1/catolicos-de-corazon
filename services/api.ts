// API Service for Server Gateway Communication

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
  quota?: {
    remaining: number;
    resetTime?: string;
  };
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
    const url = `${this.baseURL}/api${endpoint}`;
    
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
  async createSession(firebaseToken: string) {
    return this.request<{ user: any; sessionToken: string }>('/auth/session', {
      method: 'POST',
      body: JSON.stringify({ firebaseToken }),
    });
  }

  // Dashboard
  async getDashboard() {
    return this.request<{
      user: any;
      usage: any;
      limits: any;
      stats: any;
    }>('/dashboard');
  }

  // Content
  async getPage1Content() {
    return this.request<{
      title: string;
      content: string;
      lastUpdated: string;
    }>('/page1');
  }

  // Chat
  async sendChatMessage(message: string, sessionId?: string) {
    return this.request<{
      response: string;
      tokensUsed: number;
      sessionId: string;
      quotaRemaining: number;
    }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    });
  }

  async getChatHistory(sessionId?: string) {
    const query = sessionId ? `?sessionId=${sessionId}` : '';
    return this.request<{
      messages: any[];
      dailyRequestsUsed: number;
    }>(`/chat/history${query}`);
  }

  // Subscription
  async createCheckoutSession(priceId: string) {
    return this.request<{
      checkoutUrl: string;
      sessionId: string;
      clientSecret: string;
    }>('/subscribe', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    });
  }

  async getSubscriptionStatus() {
    return this.request<{
      subscription: any;
      usage: any;
    }>('/subscription/status');
  }

  async createCustomerPortalSession() {
    return this.request<{
      url: string;
    }>('/subscription/portal', {
      method: 'POST',
    });
  }

  // Settings
  async updateSettings(settings: any) {
    return this.request<{
      settings: any;
    }>('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  // Notifications
  async getNotifications() {
    return this.request<{
      notifications: any[];
    }>('/notifications');
  }

  async updateNotificationPreferences(preferences: any) {
    return this.request<{
      preferences: any;
    }>('/notifications/preferences', {
      method: 'POST',
      body: JSON.stringify(preferences),
    });
  }
}

// Singleton instance
export const api = ApiService.getInstance();