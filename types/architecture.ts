// Core Architecture Types

export interface User {
  id: string;
  email: string;
  name?: string;
  subscriptionTier: 'free' | 'premium' | 'web';
  tokenUsage: {
    current: number;
    limit: number;
    resetDate: Date;
  };
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  language: 'en' | 'es' | 'fr' | 'it' | 'pt' | 'la';
  prayerStyle: 'traditional' | 'contemporary' | 'contemplative';
  notifications: {
    dailyPrayers: boolean;
    liturgicalReminders: boolean;
    communityUpdates: boolean;
  };
  privacyMode: 'standard' | 'enhanced';
}

export interface Prayer {
  id: string;
  title: string;
  content: string;
  category: PrayerCategory;
  source?: string; // Scripture reference, saint, etc.
  language: string;
  isPersonalized: boolean;
  liturgicalRelevance?: LiturgicalRelevance;
  metadata: {
    generatedAt: Date;
    tokensUsed: number;
    userIntent: string;
  };
}

export type PrayerCategory = 
  | 'morning'
  | 'evening' 
  | 'meals'
  | 'rosary'
  | 'novena'
  | 'intercession'
  | 'thanksgiving'
  | 'petition'
  | 'adoration'
  | 'reparation';

export interface LiturgicalDay {
  date: Date;
  season: LiturgicalSeason;
  rank: LiturgicalRank;
  color: LiturgicalColor;
  readings: {
    firstReading: Reading;
    psalm: Reading;
    secondReading?: Reading;
    gospel: Reading;
  };
  saints: Saint[];
  properPrayers: Prayer[];
}

export type LiturgicalSeason = 
  | 'advent'
  | 'christmas'
  | 'ordinary_time'
  | 'lent' 
  | 'easter_triduum'
  | 'easter';

export type LiturgicalRank = 
  | 'solemnity'
  | 'feast'
  | 'memorial'
  | 'optional_memorial'
  | 'weekday';

export type LiturgicalColor = 
  | 'white'
  | 'red'
  | 'green'
  | 'violet'
  | 'rose'
  | 'black';

export interface Reading {
  book: string;
  chapter: number;
  verses: string;
  text: string;
  citation: string;
}

export interface Saint {
  id: string;
  name: string;
  feastDay: Date;
  patronOf: string[];
  biography: string;
  prayers: Prayer[];
  imageUrl?: string;
  canonizationDate?: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata: {
    tokensUsed: number;
    confidence: number;
    sources: string[];
    doctrinaleReview: boolean;
  };
  sessionId: string;
}

export interface AIServiceConfig {
  model: 'gpt-4-turbo' | 'gpt-3.5-turbo';
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  guardrails: {
    enableDoctrinalFilter: boolean;
    enableContentSafety: boolean;
    enableCitation: boolean;
  };
}

export interface TokenUsage {
  userId: string;
  tokens: number;
  operation: 'prayer_generation' | 'chat' | 'reading_explanation';
  timestamp: Date;
  cost: number;
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  type: 'prayer_circle' | 'bible_study' | 'rosary_group' | 'general';
  memberCount: number;
  isPrivate: boolean;
  moderators: string[]; // user IDs
  prayerIntentions: PrayerIntention[];
  createdAt: Date;
}

export interface PrayerIntention {
  id: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
  category: 'healing' | 'family' | 'work' | 'spiritual' | 'world_peace' | 'other';
  prayerCount: number;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: 'free' | 'premium' | 'web';
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  metadata: {
    source: 'app_store' | 'google_play' | 'web';
    originalTransactionId?: string;
  };
}

export interface AdminMetrics {
  users: {
    total: number;
    active: number;
    premium: number;
    churnRate: number;
  };
  content: {
    prayersGenerated: number;
    chatMessages: number;
    avgTokensPerUser: number;
  };
  financial: {
    monthlyRevenue: number;
    costPerUser: number;
    profitMargin: number;
  };
  technical: {
    apiLatency: number;
    errorRate: number;
    uptime: number;
  };
}

// Vector Store Types for RAG
export interface EmbeddingDocument {
  id: string;
  content: string;
  metadata: {
    source: 'catechism' | 'scripture' | 'papal_document' | 'saint_writing';
    book?: string;
    chapter?: number;
    verse?: number;
    author?: string;
    date?: Date;
    doctrinaleVerified: boolean;
    language: string;
  };
  embedding: number[];
}

export interface RAGQuery {
  query: string;
  userId: string;
  context: {
    liturgicalSeason?: LiturgicalSeason;
    userPreferences: UserPreferences;
    recentConversation?: ChatMessage[];
  };
  filters: {
    sources?: string[];
    language?: string;
    doctrinaleVerified: boolean;
  };
}

export interface RAGResponse {
  answer: string;
  sources: EmbeddingDocument[];
  confidence: number;
  tokensUsed: number;
  generatedAt: Date;
}