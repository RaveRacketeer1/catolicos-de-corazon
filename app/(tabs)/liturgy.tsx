import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Book, Users, Star } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export default function LiturgyTab() {
  const [selectedDate] = useState(new Date());
  const { theme } = useTheme();

  const todaysLiturgy = {
    date: 'Domingo 15 de Diciembre, 2024',
    season: 'Adviento',
    week: 'III Domingo de Adviento (Gaudete)',
    color: 'Rosa',
    readings: {
      first: {
        book: 'Sofonías',
        chapter: '3',
        verses: '14-18',
        text: 'Grita de gozo, hija de Sión; lanza vítores, Israel; gózate y ríete de todo corazón, Jerusalén...'
      },
      psalm: {
        book: 'Salmo',
        chapter: '12',
        verses: '2-6',
        text: 'Mi corazón se regocija por tu salvación, cantaré al Señor por el bien que me ha hecho...'
      },
      second: {
        book: 'Filipenses',
        chapter: '4',
        verses: '4-7',
        text: 'Hermanos: Estad siempre alegres en el Señor; os lo repito, estad alegres...'
      },
      gospel: {
        book: 'Lucas',
        chapter: '3',
        verses: '10-18',
        text: 'En aquel tiempo, la gente preguntaba a Juan el Bautista: "¿Qué debemos hacer?"...'
      }
    },
    saints: [
      {
        name: 'San Juan de la Cruz',
        title: 'Doctor de la Iglesia',
        description: 'Místico y poeta carmelita, doctor en teología mística'
      }
    ]
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primaryDark, theme.colors.primary]}
        style={styles.header}
      >
        <Calendar size={24} color="#FFFFFF" />
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.liturgicalWhite }]}>
            Calendario Litúrgico
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.accentLight }]}>
            {todaysLiturgy.date}
          </Text>
        </View>
      </LinearGradient>

      {/* Liturgical Season Banner */}
      <LinearGradient
        colors={[theme.colors.liturgicalPurple, theme.colors.liturgicalRose]}
        style={styles.seasonBanner}
      >
        <View style={styles.seasonContent}>
          <Text style={[styles.seasonTitle, { color: theme.colors.text }]}>
            {todaysLiturgy.season}
          </Text>
          <Text style={[styles.seasonWeek, { color: theme.colors.textSecondary }]}>
            {todaysLiturgy.week}
          </Text>
          <View style={styles.seasonDetails}>
            <View style={[styles.colorIndicator, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.colorText, { color: theme.colors.text }]}>
                Color Litúrgico: {todaysLiturgy.color}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Today's Readings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Lecturas del Día
        </Text>
        
        <View style={styles.readingsContainer}>
          {/* Primera Lectura */}
          <View style={styles.readingCard}>
            <LinearGradient
              colors={[theme.colors.surface, theme.colors.card]}
              style={styles.readingContent}
            >
              <Text style={[styles.readingLabel, { color: theme.colors.text }]}>
                Primera Lectura
              </Text>
              <Text style={[styles.readingCitation, { color: theme.colors.textSecondary }]}>
                {todaysLiturgy.readings.first.book} {todaysLiturgy.readings.first.chapter}, {todaysLiturgy.readings.first.verses}
              </Text>
              <Text style={[styles.readingText, { color: theme.colors.textSecondary }]}>
                {todaysLiturgy.readings.first.text}
              </Text>
            </LinearGradient>
          </View>

          {/* Salmo */}
          <View style={styles.readingCard}>
            <LinearGradient
              colors={[theme.colors.accentLight, theme.colors.liturgicalGold]}
              style={styles.readingContent}
            >
              <Text style={[styles.readingLabel, { color: theme.colors.primaryDark }]}>
                Salmo Responsorial
              </Text>
              <Text style={[styles.readingCitation, { color: theme.colors.primary }]}>
                {todaysLiturgy.readings.psalm.book} {todaysLiturgy.readings.psalm.chapter}, {todaysLiturgy.readings.psalm.verses}
              </Text>
              <Text style={[styles.readingText, { color: theme.colors.primary }]}>
                {todaysLiturgy.readings.psalm.text}
              </Text>
            </LinearGradient>
          </View>

          {/* Segunda Lectura */}
          <View style={styles.readingCard}>
            <LinearGradient
              colors={[theme.colors.surface, theme.colors.card]}
              style={styles.readingContent}
            >
              <Text style={[styles.readingLabel, { color: theme.colors.text }]}>
                Segunda Lectura
              </Text>
              <Text style={[styles.readingCitation, { color: theme.colors.textSecondary }]}>
                {todaysLiturgy.readings.second.book} {todaysLiturgy.readings.second.chapter}, {todaysLiturgy.readings.second.verses}
              </Text>
              <Text style={[styles.readingText, { color: theme.colors.textSecondary }]}>
                {todaysLiturgy.readings.second.text}
              </Text>
            </LinearGradient>
          </View>

          {/* Evangelio */}
          <View style={styles.readingCard}>
            <LinearGradient
              colors={[theme.colors.liturgicalGold, theme.colors.accentLight]}
              style={styles.readingContent}
            >
              <Text style={[styles.readingLabel, { color: theme.colors.primary }]}>
                Evangelio
              </Text>
              <Text style={[styles.readingCitation, { color: theme.colors.primary }]}>
                {todaysLiturgy.readings.gospel.book} {todaysLiturgy.readings.gospel.chapter}, {todaysLiturgy.readings.gospel.verses}
              </Text>
              <Text style={[styles.readingText, { color: theme.colors.primary }]}>
                {todaysLiturgy.readings.gospel.text}
              </Text>
            </LinearGradient>
          </View>
        </View>
      </View>

      {/* Saints of the Day */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Santos del Día
        </Text>
        
        {todaysLiturgy.saints.map((saint, index) => (
          <View key={index} style={styles.saintCard}>
            <LinearGradient
              colors={[theme.colors.surface, theme.colors.card]}
              style={styles.saintContent}
            >
              <View style={styles.saintHeader}>
                <Star size={20} color="#FFD700" />
                <Text style={[styles.saintName, { color: theme.colors.text }]}>
                  {saint.name}
                </Text>
              </View>
              <Text style={[styles.saintTitle, { color: theme.colors.textSecondary }]}>
                {saint.title}
              </Text>
              <Text style={[styles.saintDescription, { color: theme.colors.textSecondary }]}>
                {saint.description}
              </Text>
            </LinearGradient>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Acciones Litúrgicas
        </Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryLight]}
              style={styles.actionGradient}
            >
              <Book size={24} color="#FFFFFF" />
              <Text style={[styles.actionText, { color: theme.colors.liturgicalWhite }]}>
                Liturgia de las Horas
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={[theme.colors.liturgicalPurple, theme.colors.liturgicalRose]}
              style={styles.actionGradient}
            >
              <Calendar size={24} color="#FFFFFF" />
              <Text style={[styles.actionText, { color: theme.colors.liturgicalWhite }]}>
                Ver Calendario
              </Text>
            </LinearGradient>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  headerContent: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
  },
  seasonBanner: {
    padding: 20,
    margin: 16,
    borderRadius: 16,
  },
  seasonContent: {
    alignItems: 'center',
  },
  seasonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  seasonWeek: {
    fontSize: 16,
    marginBottom: 8,
  },
  seasonDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  colorText: {
    fontSize: 14,
    fontWeight: '500',
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
  readingsContainer: {
    gap: 16,
  },
  readingCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  readingContent: {
    padding: 16,
  },
  readingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  readingCitation: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  readingText: {
    fontSize: 14,
    lineHeight: 20,
  },
  saintCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saintContent: {
    padding: 16,
  },
  saintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  saintName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saintTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  saintDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
});