import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Sparkles, Clock, Book, Calendar, Star } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { geminiService } from '@/services/gemini';
import { FirebaseService } from '@/services/firebase';

const { width } = Dimensions.get('window');

export default function PrayerTab() {
  const [selectedCategory, setSelectedCategory] = useState<string>('morning');
  const [currentPrayer, setCurrentPrayer] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { theme } = useTheme();
  const { user, updateTokenUsage } = useAuth();

  const prayerCategories = [
    { id: 'morning', name: 'Oración Matutina', icon: Clock, color: '#FFB347' },
    { id: 'rosary', name: 'Santo Rosario', icon: Heart, color: '#DDA0DD' },
    { id: 'adoration', name: 'Adoración', icon: Sparkles, color: '#FFD700' },
    { id: 'intercession', name: 'Intercesión', icon: Book, color: '#98FB98' },
  ];

  const defaultPrayers = {
    morning: {
      title: 'Oración de la Mañana',
      content: 'Oh Dios, que en tu providencia has querido que comience este nuevo día, concédeme la gracia de emplearlo enteramente en tu servicio, para que todos mis pensamientos, palabras y obras sean para mayor gloria tuya. Amén.',
    },
    rosary: {
      title: 'Primer Misterio Gozoso',
      content: 'En el primer misterio gozoso contemplamos la Anunciación del Ángel a María. Dios te salve, María, llena eres de gracia, el Señor es contigo...',
    },
    adoration: {
      title: 'Acto de Adoración',
      content: 'Te adoro, Dios mío, y te amo con todo mi corazón. Te doy gracias por haberme creado, redimido y llamado a la fe católica. Perdóname mis pecados y concédeme la gracia de servirte fielmente. Amén.',
    },
    intercession: {
      title: 'Oración de Intercesión',
      content: 'Señor Jesús, te presento en este momento todas las intenciones de mi corazón. Por la intercesión de María Santísima y de todos los santos, escucha nuestras súplicas y concédenos lo que sea para mayor gloria tuya y bien de nuestras almas. Amén.',
    },
  };

  const checkTokenLimit = (): boolean => {
    if (!user) return false;
    
    const remainingTokens = user.tokenLimit - user.tokensUsed;
    if (remainingTokens < 500) {
      Alert.alert(
        'Límite de Tokens',
        'No tienes suficientes tokens para generar una oración personalizada. Actualiza tu suscripción para continuar.',
        [{ text: 'Entendido' }]
      );
      return false;
    }
    return true;
  };

  const handlePersonalizePrayer = async () => {
    if (!user || isGenerating) return;
    
    if (!checkTokenLimit()) return;

    setIsGenerating(true);

    try {
      const { title, content, tokensUsed } = await geminiService.generatePersonalizedPrayer({
        category: selectedCategory,
        personalContext: `Usuario: ${user.name}, preferencias de oración`,
        liturgicalContext: { season: 'Adviento', date: new Date() },
      });

      const personalizedPrayer = { title, content };
      setCurrentPrayer(personalizedPrayer);

      // Save prayer to Firebase
      await FirebaseService.saveGeneratedPrayer({
        userId: user.id,
        title,
        content,
        category: selectedCategory,
        tokensUsed,
      });

      // Update token usage
      await updateTokenUsage(tokensUsed);

      Alert.alert(
        'Oración Personalizada',
        `Se ha generado una oración especial para ti. Tokens utilizados: ${tokensUsed}`,
        [{ text: 'Gracias' }]
      );

    } catch (error: any) {
      console.error('Error generating prayer:', error);
      Alert.alert('Error', error.message || 'Error al generar oración personalizada');
    } finally {
      setIsGenerating(false);
    }
  };

  const displayPrayer = currentPrayer || defaultPrayers[selectedCategory as keyof typeof defaultPrayers];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primaryDark, theme.colors.primary]}
        style={styles.header}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.liturgicalWhite }]}>
          Acompañamiento Espiritual
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.accentLight }]}>
          Que cada oración sea un encuentro con el Divino
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        {/* Prayer Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Momentos de Oración
          </Text>
          <View style={styles.categoriesGrid}>
            {prayerCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: theme.colors.surface },
                    selectedCategory === category.id && styles.categoryCardActive
                  ]}
                  onPress={() => {
                    setSelectedCategory(category.id);
                    setCurrentPrayer(null); // Reset to default prayer
                  }}
                >
                  <LinearGradient
                    colors={[category.color, `${category.color}80`]}
                    style={styles.categoryIcon}
                  >
                    <IconComponent size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Current Prayer */}
        <View style={styles.section}>
          <View style={styles.prayerCard}>
            <LinearGradient
              colors={[theme.colors.surface, theme.colors.card]}
              style={styles.prayerContent}
            >
              <View style={styles.prayerHeader}>
                <Text style={[styles.prayerTitle, { color: theme.colors.text }]}>
                  {displayPrayer?.title}
                </Text>
                {currentPrayer && (
                  <View style={styles.personalizedBadge}>
                    <Star size={16} color="#FFD700" />
                    <Text style={[styles.personalizedText, { color: theme.colors.primary }]}>
                      Personalizada
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={[styles.prayerText, { color: theme.colors.textSecondary }]}>
                {displayPrayer?.content}
              </Text>
              
              <TouchableOpacity 
                style={[styles.personalizeButton, { opacity: isGenerating ? 0.7 : 1 }]}
                onPress={handlePersonalizePrayer}
                disabled={isGenerating}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryLight]}
                  style={styles.buttonGradient}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Sparkles size={16} color="#FFFFFF" />
                  )}
                  <Text style={[styles.buttonText, { color: theme.colors.liturgicalWhite }]}>
                    {isGenerating ? 'Generando...' : 'Personalizar con IA'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Acciones Rápidas
          </Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFB347' }]}>
                <Heart size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Generar Oración
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#DDA0DD' }]}>
                <Book size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Lecturas Diarias
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAction}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#98FB98' }]}>
                <Calendar size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Horarios Litúrgicos
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryCardActive: {
    borderWidth: 2,
    borderColor: '#D4A574',
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  prayerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  prayerContent: {
    padding: 24,
  },
  prayerHeader: {
    marginBottom: 16,
  },
  prayerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  personalizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  personalizedText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  prayerText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'justify',
  },
  personalizeButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});