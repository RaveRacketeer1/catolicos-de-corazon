import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  subscriptionTier: 'trial' | 'monthly' | 'annual';
  subscriptionStatus: 'active' | 'trial' | 'expired' | 'canceled';
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

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  tokensUsed?: number;
  sessionId: string;
}

export class FirebaseService {
  // Authentication
  static async signUpWithEmail(email: string, password: string, name: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userData: User = {
        id: firebaseUser.uid,
        name,
        email,
        subscriptionTier: 'trial',
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        tokensUsed: 0,
        tokenLimit: 1200000, // 1.2M tokens for trial
        createdAt: new Date(),
        preferences: {
          theme: 'auto',
          notifications: true,
          language: 'es',
        },
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      return userData;
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  static async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await this.getUserData(userCredential.user.uid);
      return userData;
    } catch (error: any) {
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  static async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userData = await this.getUserData(firebaseUser.uid);
          callback(userData);
        } catch (error) {
          console.error('Error getting user data:', error);
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  // User Management
  static async getUserData(userId: string): Promise<User> {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      throw new Error('Usuario no encontrado');
    }
    
    const data = userDoc.data();
    return {
      ...data,
      trialEndsAt: data.trialEndsAt?.toDate(),
      createdAt: data.createdAt?.toDate(),
    } as User;
  }

  static async updateUserSubscription(
    userId: string, 
    subscriptionData: {
      tier: 'monthly' | 'annual';
      status: 'active';
      tokenLimit: number;
    }
  ): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      subscriptionTier: subscriptionData.tier,
      subscriptionStatus: subscriptionData.status,
      tokenLimit: subscriptionData.tokenLimit,
      trialEndsAt: null, // Remove trial end date
    });
  }

  static async updateTokenUsage(userId: string, tokensUsed: number): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      tokensUsed: increment(tokensUsed),
    });
  }

  static async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      preferences,
    });
  }

  // Chat Management
  static async saveChatMessage(message: ChatMessage): Promise<void> {
    await addDoc(collection(db, 'chatMessages'), {
      ...message,
      timestamp: serverTimestamp(),
    });
  }

  static async getChatHistory(userId: string, sessionId: string, limitCount = 20): Promise<ChatMessage[]> {
    const q = query(
      collection(db, 'chatMessages'),
      where('userId', '==', userId),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as ChatMessage[];
  }

  // Prayer Management
  static async saveGeneratedPrayer(prayer: {
    userId: string;
    title: string;
    content: string;
    category: string;
    tokensUsed: number;
  }): Promise<void> {
    await addDoc(collection(db, 'prayers'), {
      ...prayer,
      createdAt: serverTimestamp(),
    });
  }

  static async getUserPrayers(userId: string, limitCount = 10): Promise<any[]> {
    const q = query(
      collection(db, 'prayers'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    }));
  }

  // Error handling
  private static getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuario no encontrado';
      case 'auth/wrong-password':
        return 'Contraseña incorrecta';
      case 'auth/email-already-in-use':
        return 'Este email ya está registrado';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Intenta más tarde';
      default:
        return 'Error de autenticación. Intenta nuevamente';
    }
  }
}