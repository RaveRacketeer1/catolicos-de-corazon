import React, { createContext, useContext, useState, useEffect } from 'react';
import { hasValidConfig } from '@/config/firebase';

// Mock user type for demo mode
export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionTier: 'trial' | 'monthly' | 'annual';
  subscriptionStatus: 'trial' | 'active' | 'inactive';
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
  signOut: () => Promise<void>;
  updateSubscription: (tier: 'monthly' | 'annual') => Promise<void>;
  updateTokenUsage: (tokens: number) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      if (hasValidConfig) {
        try {
          const { FirebaseService } = await import('@/services/firebase');
          const unsubscribe = FirebaseService.onAuthStateChanged((userData) => {
            setUser(userData);
            setIsLoading(false);
            setIsInitialized(true);
          });
          return unsubscribe;
        } catch (error) {
          console.warn('Firebase service not available:', error);
          setIsLoading(false);
          setIsInitialized(true);
        }
      } else {
        // Demo mode - no real authentication
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    const cleanup = initializeAuth();
    
    return () => {
      cleanup?.then(unsubscribe => unsubscribe?.());
    };
  }, []);

  const createDemoUser = (email: string, name: string): User => ({
    id: 'demo-user-' + Date.now(),
    name,
    email,
    subscriptionTier: 'trial',
    subscriptionStatus: 'trial',
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    tokensUsed: 0,
    tokenLimit: 1200000,
    createdAt: new Date(),
    preferences: {
      theme: 'auto',
      notifications: true,
      language: 'es',
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
        const demoUser = createDemoUser(email, 'Usuario Demo');
        setUser(demoUser);
      }
    } catch (error: any) {
      if (!hasValidConfig) {
        // In demo mode, always succeed
        const demoUser = createDemoUser(email, 'Usuario Demo');
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
      const demoUser = createDemoUser('usuario@icloud.com', 'Usuario Apple');
      setUser(demoUser);
    } catch (error: any) {
      throw new Error('Error al iniciar sesión con Apple');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const demoUser = createDemoUser('usuario@gmail.com', 'Usuario Google');
      setUser(demoUser);
    } catch (error: any) {
      throw new Error('Error al iniciar sesión con Google');
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

  const updateSubscription = async (tier: 'monthly' | 'annual') => {
    if (!user) return;

    try {
      const tokenLimit = tier === 'annual' ? 2000000 : 1200000;
      
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