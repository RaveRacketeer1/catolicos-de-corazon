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
import { Crown, Check, Sparkles, Heart, MessageCircle, Calendar, Shield, Zap } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

type PlanType = 'monthly' | 'annual';

export default function SubscriptionScreen() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();

  const plans = {
    monthly: {
      id: 'monthly',
      name: 'Plan Mensual',
      price: '$4.99',
      period: '/mes',
      savings: null,
      description: 'Acceso completo con facturación mensual',
    },
    annual: {
      id: 'annual',
      name: 'Plan Anual',
      price: '$49.90',
      period: '/año',
      savings: 'Ahorra $9.98',
      description: 'Mejor valor - 2 meses gratis',
    },
  };

  const features = [
    {
      icon: Sparkles,
      title: 'IA Espiritual Ilimitada',
      description: 'Oraciones personalizadas y dirección espiritual sin límites',
    },
    {
      icon: MessageCircle,
      title: 'Chat con Director Espiritual',
      description: 'Conversaciones profundas guiadas por doctrina católica',
    },
    {
      icon: Calendar,
      title: 'Calendario Litúrgico Completo',
      description: 'Lecturas diarias, santos y celebraciones',
    },
    {
      icon: Heart,
      title: 'Oraciones Personalizadas',
      description: 'Generadas específicamente para tus intenciones',
    },
    {
      icon: Shield,
      title: 'Contenido Doctrinalmente Verificado',
      description: 'Respuestas basadas en magisterio católico auténtico',
    },
    {
      icon: Zap,
      title: 'Acceso Prioritario',
      description: 'Respuestas más rápidas y funciones exclusivas',
    },
  ];

  const handleSubscribe = async () => {
    setIsLoading(true);
    
    try {
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Update subscription in Firebase
      await updateSubscription(selectedPlan);
      
      Alert.alert(
        'Suscripción Iniciada',
        `Tu prueba gratuita de 7 días ha comenzado. Después se cobrará ${plans[selectedPlan].price}${plans[selectedPlan].period}.`,
        [
          {
            text: 'Continuar',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la suscripción. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsLoading(true);
    try {
      // In production, this would check with RevenueCat/App Store
      if (user && user.subscriptionStatus === 'active') {
        Alert.alert('Compras Restauradas', 'Se han restaurado tus compras anteriores.');
        router.replace('/(tabs)');
      } else {
        Alert.alert('Sin Compras', 'No se encontraron compras anteriores para restaurar.');
      }
    } catch (error) {
      Alert.alert('Error', 'No se encontraron compras anteriores.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primaryDark, theme.colors.primary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <LinearGradient
            colors={[theme.colors.liturgicalGold, theme.colors.accentLight]}
            style={styles.logoContainer}
          >
            <Crown size={32} color={theme.colors.primary} />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: theme.colors.liturgicalWhite }]}>
            Acompañamiento Espiritual Premium
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.accentLight }]}>
            Profundiza tu fe con IA católica auténtica
          </Text>
        </View>
      </LinearGradient>

      {/* Trial Banner */}
      <View style={styles.trialBanner}>
        <LinearGradient
          colors={[theme.colors.liturgicalGold, theme.colors.accentLight]}
          style={styles.trialContent}
        >
          <Sparkles size={20} color={theme.colors.primary} />
          <Text style={[styles.trialText, { color: theme.colors.primary }]}>
            🎉 Prueba GRATIS por 7 días - Cancela cuando quieras
          </Text>
        </LinearGradient>
      </View>

      {/* Pricing Plans */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Elige tu Plan
        </Text>
        
        <View style={styles.plansContainer}>
          {/* Monthly Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <LinearGradient
              colors={
                selectedPlan === 'monthly'
                  ? [theme.colors.primary, theme.colors.primaryLight]
                  : [theme.colors.surface, theme.colors.card]
              }
              style={styles.planContent}
            >
              <View style={styles.planHeader}>
                <Text style={[
                  styles.planName,
                  { color: selectedPlan === 'monthly' ? theme.colors.liturgicalWhite : theme.colors.text }
                ]}>
                  {plans.monthly.name}
                </Text>
                {selectedPlan === 'monthly' && (
                  <View style={styles.selectedIndicator}>
                    <Check size={16} color={theme.colors.liturgicalGold} />
                  </View>
                )}
              </View>
              <View style={styles.priceContainer}>
                <Text style={[
                  styles.price,
                  { color: selectedPlan === 'monthly' ? theme.colors.liturgicalWhite : theme.colors.text }
                ]}>
                  {plans.monthly.price}
                </Text>
                <Text style={[
                  styles.period,
                  { color: selectedPlan === 'monthly' ? theme.colors.accentLight : theme.colors.textSecondary }
                ]}>
                  {plans.monthly.period}
                </Text>
              </View>
              <Text style={[
                styles.planDescription,
                { color: selectedPlan === 'monthly' ? theme.colors.accentLight : theme.colors.textSecondary }
              ]}>
                {plans.monthly.description}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Annual Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'annual' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('annual')}
          >
            <LinearGradient
              colors={
                selectedPlan === 'annual'
                  ? [theme.colors.primary, theme.colors.primaryLight]
                  : [theme.colors.surface, theme.colors.card]
              }
              style={styles.planContent}
            >
              {plans.annual.savings && (
                <View style={styles.savingsBadge}>
                  <Text style={[styles.savingsText, { color: theme.colors.liturgicalGold }]}>
                    {plans.annual.savings}
                  </Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={[
                  styles.planName,
                  { color: selectedPlan === 'annual' ? theme.colors.liturgicalWhite : theme.colors.text }
                ]}>
                  {plans.annual.name}
                </Text>
                {selectedPlan === 'annual' && (
                  <View style={styles.selectedIndicator}>
                    <Check size={16} color={theme.colors.liturgicalGold} />
                  </View>
                )}
              </View>
              <View style={styles.priceContainer}>
                <Text style={[
                  styles.price,
                  { color: selectedPlan === 'annual' ? theme.colors.liturgicalWhite : theme.colors.text }
                ]}>
                  {plans.annual.price}
                </Text>
                <Text style={[
                  styles.period,
                  { color: selectedPlan === 'annual' ? theme.colors.accentLight : theme.colors.textSecondary }
                ]}>
                  {plans.annual.period}
                </Text>
              </View>
              <Text style={[
                styles.planDescription,
                { color: selectedPlan === 'annual' ? theme.colors.accentLight : theme.colors.textSecondary }
              ]}>
                {plans.annual.description}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Features List */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Características Premium
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
                  Comenzar Prueba Gratuita de 7 Días
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <Text style={[styles.subscribeSubtext, { color: theme.colors.textSecondary }]}>
          Después {plans[selectedPlan].price}{plans[selectedPlan].period} • Cancela en cualquier momento
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
            Restaurar Compras
          </Text>
        </TouchableOpacity>
      </View>

      {/* Terms */}
      <View style={styles.footer}>
        <Text style={[styles.termsText, { color: theme.colors.textTertiary }]}>
          Al suscribirte, aceptas nuestros términos de servicio y política de privacidad.
        </Text>
        <Text style={[styles.termsSubtext, { color: theme.colors.textTertiary }]}>
          La suscripción se renovará automáticamente.
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
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
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
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
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
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
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