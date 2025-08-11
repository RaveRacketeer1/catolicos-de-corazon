import { useEffect } from 'react';
import 'react-native-get-random-values'; // Required for Firebase
import 'react-native-url-polyfill/auto'; // Required for Firebase Auth
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <ThemeProvider>
        <AuthProvider>
          <>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="subscription" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="account" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="subscription-management" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
          </>
        </AuthProvider>
      </ThemeProvider>
    </StripeProvider>
  );
}