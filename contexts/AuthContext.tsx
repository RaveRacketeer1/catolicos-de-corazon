import React, { createContext, useContext, useState, useEffect } from 'react';
import { hasValidConfig } from '@/config/firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  subscriptionStatus: 'trial' | 'active' | 'inactive' | 'canceled';
  trialEndsAt?: Date;
  tokensUsed: number;
  tokenLimit: number;
  createdAt: Date;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    language: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  hasActiveSubscription: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  updateSubscription: (tier: 'premium' | 'enterprise') => Promise<void>;
  updateTokenUsage: (tokens: number) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      if (hasValidConfig) {
        try {
          const { FirebaseService } = await import('@/services/firebase');
          const unsubscribe = FirebaseService.onAuthStateChanged((userData) => {
            if (isMounted) {
              setUser(userData);
              setIsLoading(false);
              setIsInitialized(true);
            }
          });
          return unsubscribe;
        } catch (error) {
          console.warn('Firebase service not available:', error);
          if (isMounted) {
            setIsLoading(false);
            setIsInitialized(true);
          }
        }
      } else {
        // Demo mode - no real authentication
        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      isMounted = false;
      cleanup?.then(unsubscribe => unsubscribe?.());
    };
  }, []);

  const createDemoUser = (email: string, name: string): User => ({
    id: 'demo-user-' + Date.now(),
    name,
    email,
    subscriptionTier: 'free',
    subscriptionStatus: 'trial',
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    tokensUsed: 0,
    tokenLimit: 100000,
    createdAt: new Date(),
    preferences: {
      theme: 'auto',
      notifications: true,
      language: 'en',
    },
  });

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (hasValidConfig) {
        const { FirebaseService } = await import('@/services/firebase');
        const userData = await FirebaseService.signInWithEmail(email, password);
        setUser(userData);
      } else {
        // Demo mode
        const demoUser = createDemoUser(email, 'Demo User');
        setUser(demoUser);
      }
    } catch (error: any) {
      if (!hasValidConfig) {
        // In demo mode, always succeed
        const demoUser = createDemoUser(email, 'Demo User');
        setUser(demoUser);
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      if (hasValidConfig) {
        const { FirebaseService } = await import('@/services/firebase');
        const userData = await FirebaseService.signUpWithEmail(email, password, name);
        setUser(userData);
      } else {
        // Demo mode
        const demoUser = createDemoUser(email, name);
        setUser(demoUser);
      }
    } catch (error: any) {
      if (!hasValidConfig) {
        // In demo mode, always succeed
        const demoUser = createDemoUser(email, name);
        setUser(demoUser);
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithApple = async () => {
    setIsLoading(true);
    try {
      if (hasValidConfig) {
        const { FirebaseService } = await import('@/services/firebase');
        const userData = await FirebaseService.signInWithApple();
        setUser(userData);
      } else {
        const demoUser = createDemoUser('user@icloud.com', 'Apple User');
        setUser(demoUser);
      }
    } catch (error: any) {
      if (!hasValidConfig) {
        const demoUser = createDemoUser('user@icloud.com', 'Apple User');
        setUser(demoUser);
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (hasValidConfig) {
        const { FirebaseService } = await import('@/services/firebase');
        const userData = await FirebaseService.signInWithGoogle();
        setUser(userData);
      } else {
        const demoUser = createDemoUser('user@gmail.com', 'Google User');
        setUser(demoUser);
      }
    } catch (error: any) {
      if (!hasValidConfig) {
        const demoUser = createDemoUser('user@gmail.com', 'Google User');
        setUser(demoUser);
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithFacebook = async () => {
    setIsLoading(true);
    try {
      if (hasValidConfig) {
        const { FirebaseService } = await import('@/services/firebase');
        const userData = await FirebaseService.signInWithFacebook();
        setUser(userData);
      } else {
        const demoUser = createDemoUser('user@facebook.com', 'Facebook User');
        setUser(demoUser);
      }
    } catch (error: any) {
      if (!hasValidConfig) {
        const demoUser = createDemoUser('user@facebook.com', 'Facebook User');
        setUser(demoUser);
      } else {
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (hasValidConfig) {
        const { FirebaseService } = await import('@/services/firebase');
        await FirebaseService.signOut();
      }
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateSubscription = async (tier: 'premium' | 'enterprise') => {
    if (!user) return;

    try {
      const tokenLimit = tier === 'enterprise' ? 500000 : 100000;
      
      if (hasValidConfig) {
        const { FirebaseService } = await import('@/services/firebase');
        await FirebaseService.updateUserSubscription(user.id, {
          tier,
          status: 'active',
          tokenLimit,
        });
      }

      // Update local user state
      setUser(prev => prev ? {
        ...prev,
        subscriptionTier: tier,
        subscriptionStatus: 'active',
        tokenLimit,
        trialEndsAt: undefined,
      } : null);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  };

  const updateTokenUsage = async (tokens: number) => {
    if (!user) return;

    try {
      if (hasValidConfig) {
        const { FirebaseService } = await import('@/services/firebase');
        await FirebaseService.updateTokenUsage(user.id, tokens);
      }
      
      // Update local state
      setUser(prev => prev ? {
        ...prev,
        tokensUsed: prev.tokensUsed + tokens,
      } : null);
    } catch (error) {
      console.error('Error updating token usage:', error);
    }
  };

  const hasActiveSubscription = user?.subscriptionStatus === 'active' || 
    (user?.subscriptionStatus === 'trial' && user?.trialEndsAt && user.trialEndsAt > new Date());

  const value: AuthContextType = {
    user,
    isLoading,
    hasActiveSubscription,
    signIn,
    signUp,
    signInWithApple,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    updateSubscription,
    updateTokenUsage,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}