import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

export default function Index() {
  const { isAuthenticated, isLoading, hasActiveSubscription } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && hasActiveSubscription) {
        router.replace('/(tabs)');
      } else if (isAuthenticated && !hasActiveSubscription) {
        router.replace('/subscription');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, hasActiveSubscription]);

  return (
    <LinearGradient
      colors={[theme.colors.primaryDark, theme.colors.primary]}
      style={styles.container}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.colors.liturgicalGold} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});