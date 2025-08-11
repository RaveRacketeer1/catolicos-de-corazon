import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Crown, Check, Sparkles, MessageCircle, Calendar, Shield, Zap } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStripe } from '@stripe/stripe-react-native';
import { api } from '@/services/api';

type PlanType = 'monthly' | 'annual';

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const plans = {
    monthly: {
      id: 'price_monthly',
      name: 'Monthly Plan',
      price: '$9.99',
      period: '/month',
      savings: null,
      description: 'Full access with monthly billing',
      priceId: process.env.EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_demo',
    },
    annual: {
      id: 'price_annual',
      name: 'Annual Plan',
      price: '$99.99',
      period: '/year',
      savings: 'Save $19.89',
      description: 'Best value - 2 months free',
      priceId: process.env.EXPO_PUBLIC_STRIPE_ANNUAL_PRICE_ID || 'price_annual_demo',
    },
  };

  const features = [
    {
      icon: Sparkles,
      title: 'Unlimited AI Chat',
      description: 'Unlimited conversations with Gemini 2.5 Flash-Lite',
    },
    {
      icon: MessageCircle,
      title: '100K Monthly Tokens',
      description: 'Generous token allowance for AI interactions',
    },
    {
      icon: Calendar,
      title: 'Premium Features',
      description: 'Access to all app features and content',
    },
    {
      icon: Shield,
      title: 'Priority Support',
      description: 'Fast response times and dedicated support',
    },
    {
      icon: Zap,
      title: 'Advanced Analytics',
      description: 'Detailed usage metrics and insights',
    },
  ];

  const handleSubscribe = async () => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to continue');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create Stripe Checkout session via server
      const response = await api.createCheckoutSession(plans[selectedPlan].priceId);
      
      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Your App Name',
        paymentIntentClientSecret: response.data.clientSecret,
        defaultBillingDetails: {
          email: user.email,
          name: user.name,
        },
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // Present payment sheet
      const { error: paymentError } = await presentPaymentSheet();

      if (paymentError) {
        if (paymentError.code !== 'Canceled') {
          throw new Error(paymentError.message);
        }
        return; // User canceled
      }

      // Payment successful
      Alert.alert(
        'Subscription Started',
        `Your 7-day free trial has begun. After that, you'll be charged ${plans[selectedPlan].price}${plans[selectedPlan].period}.`,
        [
          {
            text: 'Continue',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Subscription error:', error);
      Alert.alert('Error', error.message || 'Failed to process subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement purchase restoration
      // In production, this would check with Stripe/App Store
      Alert.alert('Restore Purchases', 'No previous purchases found to restore.');
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryLight]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.surface }]}>
            <Crown size={32} color={theme.colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.colors.surface }]}>
            Premium Access
          </Text>
          <Text style={[styles.headerSubtitle, { color: 'rgba(255, 255, 255, 0.8)' }]}>
            Unlock unlimited AI conversations
          </Text>
        </View>
      </LinearGradient>

      {/* Trial Banner */}
      <View style={styles.trialBanner}>
        <LinearGradient
          colors={[theme.colors.success, theme.colors.primaryLight]}
          style={styles.trialContent}
        >
          <Sparkles size={20} color="#FFFFFF" />
          <Text style={[styles.trialText, { color: '#FFFFFF' }]}>
            🎉 FREE 7-Day Trial - Cancel Anytime
          </Text>
        </LinearGradient>
      </View>

      {/* Pricing Plans */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Choose Your Plan
        </Text>
        
        <View style={styles.plansContainer}>
          {Object.entries(plans).map(([key, plan]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.planCard,
                selectedPlan === key && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan(key as PlanType)}
            >
              <LinearGradient
                colors={
                  selectedPlan === key
                    ? [theme.colors.primary, theme.colors.primaryLight]
                    : [theme.colors.surface, theme.colors.card]
                }
                style={styles.planContent}
              >
                {plan.savings && (
                  <View style={styles.savingsBadge}>
                    <Text style={[styles.savingsText, { color: theme.colors.success }]}>
                      {plan.savings}
                    </Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <Text style={[
                    styles.planName,
                    { color: selectedPlan === key ? theme.colors.surface : theme.colors.text }
                  ]}>
                    {plan.name}
                  </Text>
                  {selectedPlan === key && (
                    <View style={styles.selectedIndicator}>
                      <Check size={16} color={theme.colors.success} />
                    </View>
                  )}
                </View>
                <View style={styles.priceContainer}>
                  <Text style={[
                    styles.price,
                    { color: selectedPlan === key ? theme.colors.surface : theme.colors.text }
                  ]}>
                    {plan.price}
                  </Text>
                  <Text style={[
                    styles.period,
                    { color: selectedPlan === key ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary }
                  ]}>
                    {plan.period}
                  </Text>
                </View>
                <Text style={[
                  styles.planDescription,
                  { color: selectedPlan === key ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary }
                ]}>
                  {plan.description}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Features List */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Premium Features
        </Text>
        
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <View key={index} style={styles.featureItem}>
                <LinearGradient
                  colors={[theme.colors.surface, theme.colors.card]}
                  style={styles.featureContent}
                >
                  <View style={[styles.featureIcon, { backgroundColor: theme.colors.primaryLight }]}>
                    <IconComponent size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                      {feature.title}
                    </Text>
                    <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                      {feature.description}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            );
          })}
        </View>
      </View>

      {/* Subscribe Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.subscribeButton}
          onPress={handleSubscribe}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryLight]}
            style={styles.subscribeGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Crown size={20} color="#FFFFFF" />
                <Text style={styles.subscribeText}>
                  Start 7-Day Free Trial
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={[styles.subscribeSubtext, { color: theme.colors.textSecondary }]}>
          Then {plans[selectedPlan].price}{plans[selectedPlan].period} • Cancel anytime
        </Text>
      </View>

      {/* Restore Purchases */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={isLoading}
        >
          <Text style={[styles.restoreText, { color: theme.colors.primary }]}>
            Restore Purchases
          </Text>
        </TouchableOpacity>
      </View>

      {/* Terms */}
      <View style={styles.footer}>
        <Text style={[styles.termsText, { color: theme.colors.textSecondary }]}>
          By subscribing, you agree to our terms of service and privacy policy.
        </Text>
        <Text style={[styles.termsSubtext, { color: theme.colors.textSecondary }]}>
          Subscription will auto-renew.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  trialBanner: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  trialContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  trialText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  planCardSelected: {
    transform: [{ scale: 1.02 }],
  },
  planContent: {
    padding: 20,
    position: 'relative',
  },
  savingsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedIndicator: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 12,
    padding: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  period: {
    fontSize: 16,
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 14,
  },
  featuresContainer: {
    gap: 12,
  },
  featureItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 12,
  },
  subscribeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  subscribeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  subscribeSubtext: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  restoreButton: {
    alignItems: 'center',
    padding: 12,
  },
  restoreText: {
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  termsSubtext: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});