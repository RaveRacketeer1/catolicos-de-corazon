import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithCredential,
  OAuthProvider,
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
import { User } from '@/contexts/AuthContext';

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
        subscriptionTier: 'free',
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        tokensUsed: 0,
        tokenLimit: 10000, // Free tier: 10K tokens
        createdAt: new Date(),
        preferences: {
          theme: 'auto',
          notifications: true,
          language: 'en',
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

  static async signInWithApple(): Promise<User> {
    try {
      // TODO: Implement Apple Sign-In
      // This requires expo-apple-authentication and proper configuration
      throw new Error('Apple Sign-In not implemented yet');
    } catch (error: any) {
      throw new Error('Apple Sign-In failed: ' + error.message);
    }
  }

  static async signInWithGoogle(): Promise<User> {
    try {
      // TODO: Implement Google Sign-In
      // This requires @react-native-google-signin/google-signin
      throw new Error('Google Sign-In not implemented yet');
    } catch (error: any) {
      throw new Error('Google Sign-In failed: ' + error.message);
    }
  }

  static async signInWithFacebook(): Promise<User> {
    try {
      // TODO: Implement Facebook Sign-In
      // This requires react-native-fbsdk-next
      throw new Error('Facebook Sign-In not implemented yet');
    } catch (error: any) {
      throw new Error('Facebook Sign-In failed: ' + error.message);
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
      throw new Error('User not found');
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
      tier: 'premium' | 'enterprise';
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
  static async saveChatMessage(message: {
    userId: string;
    content: string;
    isUser: boolean;
    sessionId: string;
    tokensUsed?: number;
  }): Promise<void> {
    await addDoc(collection(db, 'chatMessages'), {
      ...message,
      timestamp: serverTimestamp(),
    });
  }

  static async getChatHistory(userId: string, sessionId: string, limitCount = 20): Promise<any[]> {
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
    }));
  }

  // Error handling
  private static getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'User not found';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'This email is already registered';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      default:
        return 'Authentication error. Please try again';
    }
  }
}