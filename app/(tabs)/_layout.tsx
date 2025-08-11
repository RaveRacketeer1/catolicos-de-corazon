import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Heart, MessageCircle, Calendar, Users, Settings } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { isAuthenticated, isLoading, hasActiveSubscription } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    } else if (!isLoading && isAuthenticated && !hasActiveSubscription) {
      router.replace('/subscription');
    }
  }, [isAuthenticated, isLoading, hasActiveSubscription]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.liturgicalGold} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Cargando...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated || !hasActiveSubscription) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.primary,
          borderTopColor: theme.colors.primaryLight,
          paddingVertical: 5,
        },
        tabBarActiveTintColor: theme.colors.liturgicalGold,
        tabBarInactiveTintColor: theme.colors.primaryLight,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Oración',
          tabBarIcon: ({ size, color }) => (
            <Heart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Director Espiritual',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="liturgy"
        options={{
          title: 'Liturgia',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});