import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Settings, User, Bell, Shield, Crown, Heart, BookOpen, ChartBar as BarChart3, LogOut, Zap } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileTab() {
  const { user, signOut } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

  const userStats = {
    prayersGenerated: 127,
    chatSessions: 45,
    tokensUsed: 1150000,
    tokenLimit: 1200000,
    dayStreak: 23,
  };

  const subscriptionInfo = {
    tier: user?.subscriptionTier === 'annual' ? 'Anual' : 
          user?.subscriptionTier === 'monthly' ? 'Mensual' : 'Prueba',
    renewalDate: user?.trialEndsAt?.toLocaleDateString() || '2025-01-15',
    cost: user?.subscriptionTier === 'annual' ? '$49.90/año' : 
          user?.subscriptionTier === 'monthly' ? '$4.99/mes' : 'Gratis',
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primaryDark, theme.colors.primary]}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[theme.colors.liturgicalGold, theme.colors.accentLight]}
              style={styles.avatar}
            >
              <User size={32} color={theme.colors.primary} />
            </LinearGradient>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.liturgicalWhite }]}>
              {user?.name || 'Usuario'}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.colors.accentLight }]}>
              {user?.email || 'email@ejemplo.com'}
            </Text>
            <View style={styles.subscriptionBadge}>
              <Crown size={16} color="#FFD700" />
              <Text style={[styles.subscriptionText, { color: theme.colors.liturgicalGold }]}>
                {user?.subscriptionTier === 'annual' ? 'Premium Anual' : 
                 user?.subscriptionTier === 'monthly' ? 'Premium Mensual' : 'Prueba Gratuita'}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Token Usage */}
      <View style={styles.section}>
        <View style={styles.tokenCard}>
          <LinearGradient
            colors={[theme.colors.surface, theme.colors.card]}
            style={styles.tokenContent}
          >
            <View style={styles.tokenHeader}>
              <Zap size={20} color={theme.colors.primary} />
              <Text style={[styles.tokenTitle, { color: theme.colors.text }]}>
                Uso de Tokens IA
              </Text>
            </View>
            <View style={styles.tokenProgress}>
              <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${(userStats.tokensUsed / userStats.tokenLimit) * 100}%`,
                      backgroundColor: theme.colors.primary
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.tokenText, { color: theme.colors.textSecondary }]}>
                {(userStats.tokensUsed / 1000).toFixed(0)}K / {(userStats.tokenLimit / 1000).toFixed(0)}K tokens
              </Text>
            </View>
            <Text style={[styles.renewalText, { color: theme.colors.textSecondary }]}>
              Se renueva el {subscriptionInfo.renewalDate}
            </Text>
          </LinearGradient>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Estadísticas Espirituales
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[theme.colors.liturgicalGreen, theme.colors.success]}
              style={styles.statContent}
            >
              <Heart size={24} color="#FFFFFF" />
              <Text style={[styles.statNumber, { color: theme.colors.liturgicalWhite }]}>
                {userStats.prayersGenerated}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.liturgicalWhite }]}>
                Oraciones Generadas
              </Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={[theme.colors.liturgicalPurple, theme.colors.liturgicalRose]}
              style={styles.statContent}
            >
              <BookOpen size={24} color="#FFFFFF" />
              <Text style={[styles.statNumber, { color: theme.colors.liturgicalWhite }]}>
                {userStats.chatSessions}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.liturgicalWhite }]}>
                Sesiones de Dirección
              </Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={[theme.colors.warning, theme.colors.accentLight]}
              style={styles.statContent}
            >
              <BarChart3 size={24} color="#FFFFFF" />
              <Text style={[styles.statNumber, { color: theme.colors.liturgicalWhite }]}>
                {userStats.dayStreak}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.liturgicalWhite }]}>
                Días Consecutivos
              </Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Subscription Management */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Suscripción
        </Text>
        <TouchableOpacity style={styles.subscriptionCard}>
          <LinearGradient
            colors={[theme.colors.liturgicalGold, theme.colors.accentLight]}
            style={styles.subscriptionContent}
          >
            <View style={styles.subscriptionHeader}>
              <Crown size={24} color={theme.colors.primary} />
              <View style={styles.subscriptionInfo}>
                <Text style={[styles.subscriptionTier, { color: theme.colors.primary }]}>
                  {subscriptionInfo.tier}
                </Text>
                <Text style={[styles.subscriptionCost, { color: theme.colors.textSecondary }]}>
                  {subscriptionInfo.cost}
                </Text>
              </View>
            </View>
            <Text style={[styles.subscriptionRenewal, { color: theme.colors.textSecondary }]}>
              Renovación automática: {subscriptionInfo.renewalDate}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Configuración
        </Text>
        
        <View style={styles.settingsCard}>
          <LinearGradient
            colors={[theme.colors.surface, theme.colors.card]}
            style={styles.settingsContent}
          >
            {/* Theme Selection */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Settings size={20} color={theme.colors.primary} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Tema
                </Text>
              </View>
              <View style={styles.themeSelector}>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    { backgroundColor: theme.colors.background },
                    themeMode === 'light' && { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={() => setThemeMode('light')}
                >
                  <Text style={[
                    styles.themeOptionText,
                    { color: theme.colors.text },
                    themeMode === 'light' && { color: theme.colors.liturgicalWhite }
                  ]}>
                    Claro
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    { backgroundColor: theme.colors.background },
                    themeMode === 'dark' && { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={() => setThemeMode('dark')}
                >
                  <Text style={[
                    styles.themeOptionText,
                    { color: theme.colors.text },
                    themeMode === 'dark' && { color: theme.colors.liturgicalWhite }
                  ]}>
                    Oscuro
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeOption,
                    { backgroundColor: theme.colors.background },
                    themeMode === 'auto' && { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={() => setThemeMode('auto')}
                >
                  <Text style={[
                    styles.themeOptionText,
                    { color: theme.colors.text },
                    themeMode === 'auto' && { color: theme.colors.liturgicalWhite }
                  ]}>
                    Auto
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications */}
            <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.settingLeft}>
                <Bell size={20} color={theme.colors.primary} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Notificaciones
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={notificationsEnabled ? theme.colors.primary : '#999'}
              />
            </View>

            {/* Privacy Mode */}
            <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.settingLeft}>
                <Shield size={20} color={theme.colors.primary} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Modo Privacidad Mejorada
                </Text>
              </View>
              <Switch
                value={privacyMode}
                onValueChange={setPrivacyMode}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={privacyMode ? theme.colors.primary : '#999'}
              />
            </View>

            {/* Language */}
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.settingLeft}>
                <BookOpen size={20} color={theme.colors.primary} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Idioma
                </Text>
              </View>
              <Text style={[styles.settingValue, { color: theme.colors.textSecondary }]}>
                Español
              </Text>
            </TouchableOpacity>

            {/* Privacy Policy */}
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.settingLeft}>
                <Shield size={20} color={theme.colors.primary} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Política de Privacidad
                </Text>
              </View>
            </TouchableOpacity>

            {/* Support */}
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Settings size={20} color={theme.colors.primary} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  Soporte
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryLight]}
            style={styles.logoutGradient}
          >
            <LogOut size={20} color="#FFFFFF" />
            <Text style={[styles.logoutText, { color: theme.colors.liturgicalWhite }]}>
              Cerrar Sesión
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Developed by Proton Smart SA de CV
        </Text>
        <Text style={[styles.footerSubtext, { color: theme.colors.textTertiary }]}>
          All rights reserved
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  subscriptionText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  tokenCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenContent: {
    padding: 16,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tokenTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tokenProgress: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tokenText: {
    fontSize: 14,
    fontWeight: '500',
  },
  renewalText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  statContent: {
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
  subscriptionCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subscriptionContent: {
    padding: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionInfo: {
    marginLeft: 12,
    flex: 1,
  },
  subscriptionTier: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  subscriptionCost: {
    fontSize: 14,
  },
  subscriptionRenewal: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  settingsCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsContent: {
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  themeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
});