import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Heart, Plus, MessageSquare, SprayCan as Pray, X } from 'lucide-react-native';

interface PrayerIntention {
  id: string;
  content: string;
  author: string;
  isAnonymous: boolean;
  prayerCount: number;
  category: string;
  createdAt: Date;
}

export default function CommunityTab() {
  const [showIntentionModal, setShowIntentionModal] = useState(false);
  const [newIntention, setNewIntention] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('spiritual');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const prayerIntentions: PrayerIntention[] = [
    {
      id: '1',
      content: 'Por la sanación de mi madre que está enferma',
      author: 'María G.',
      isAnonymous: false,
      prayerCount: 147,
      category: 'healing',
      createdAt: new Date('2024-12-10'),
    },
    {
      id: '2',
      content: 'Por la paz en el mundo y el fin de todos los conflictos',
      author: 'Anónimo',
      isAnonymous: true,
      prayerCount: 89,
      category: 'world_peace',
      createdAt: new Date('2024-12-12'),
    },
    {
      id: '3',
      content: 'Por mi conversión y la de mi familia',
      author: 'José M.',
      isAnonymous: false,
      prayerCount: 234,
      category: 'spiritual',
      createdAt: new Date('2024-12-14'),
    },
  ];

  const categories = [
    { id: 'healing', name: 'Sanación', color: '#98FB98', icon: Heart },
    { id: 'family', name: 'Familia', color: '#FFB347', icon: Users },
    { id: 'spiritual', name: 'Espiritual', color: '#DDA0DD', icon: Pray },
    { id: 'world_peace', name: 'Paz Mundial', color: '#87CEEB', icon: MessageSquare },
  ];

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  const handleAddIntention = () => {
    if (!newIntention.trim()) return;

    // Aquí se añadiría la lógica para enviar la intención al backend
    console.log('Nueva intención:', {
      content: newIntention,
      category: selectedCategory,
      isAnonymous,
    });

    setNewIntention('');
    setShowIntentionModal(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4A2C2A', '#8B5A2B']}
        style={styles.header}
      >
        <Users size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Comunidad de Oración</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowIntentionModal(true)}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Statistics */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#FFD700', '#FFF8DC']}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>2,847</Text>
            <Text style={styles.statLabel}>Oraciones Elevadas</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#98FB98', '#F0FFF0']}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Intenciones Activas</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#DDA0DD', '#F8F8FF']}
            style={styles.statCard}
          >
            <Text style={styles.statNumber}>423</Text>
            <Text style={styles.statLabel}>Hermanos Orando</Text>
          </LinearGradient>
        </View>

        {/* Prayer Intentions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Intenciones de Oración</Text>
          
          {prayerIntentions.map((intention) => {
            const categoryInfo = getCategoryInfo(intention.category);
            const IconComponent = categoryInfo.icon;
            
            return (
              <View key={intention.id} style={styles.intentionCard}>
                <LinearGradient
                  colors={['#FFFFFF', '#F8F8FF']}
                  style={styles.intentionContent}
                >
                  <View style={styles.intentionHeader}>
                    <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color }]}>
                      <IconComponent size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.intentionMeta}>
                      <Text style={styles.intentionAuthor}>
                        {intention.author}
                      </Text>
                      <Text style={styles.intentionDate}>
                        {intention.createdAt.toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.prayerCount}>
                      <Heart size={16} color="#8B5A2B" />
                      <Text style={styles.prayerCountText}>
                        {intention.prayerCount}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.intentionText}>
                    {intention.content}
                  </Text>
                  
                  <TouchableOpacity style={styles.prayButton}>
                    <LinearGradient
                      colors={['#8B5A2B', '#D4A574']}
                      style={styles.prayButtonGradient}
                    >
                      <Pray size={16} color="#FFFFFF" />
                      <Text style={styles.prayButtonText}>Unirme en Oración</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            );
          })}
        </View>

        {/* Community Groups */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grupos de Oración</Text>
          
          <TouchableOpacity style={styles.groupCard}>
            <LinearGradient
              colors={['#DDA0DD', '#E6E6FA']}
              style={styles.groupContent}
            >
              <Users size={20} color="#FFFFFF" />
              <Text style={styles.groupName}>Círculo del Santo Rosario</Text>
              <Text style={styles.groupMembers}>87 miembros</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.groupCard}>
            <LinearGradient
              colors={['#98FB98', '#F0FFF0']}
              style={styles.groupContent}
            >
              <Heart size={20} color="#FFFFFF" />
              <Text style={styles.groupName}>Adoración Perpetua</Text>
              <Text style={styles.groupMembers}>156 miembros</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Intention Modal */}
      <Modal
        visible={showIntentionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Intención de Oración</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowIntentionModal(false)}
            >
              <X size={24} color="#8B5A2B" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.inputLabel}>Comparte tu intención:</Text>
            <TextInput
              style={styles.intentionInput}
              value={newIntention}
              onChangeText={setNewIntention}
              placeholder="Por ejemplo: Por la sanación de un ser querido..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
            
            <Text style={styles.inputLabel}>Categoría:</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryOption,
                      selectedCategory === category.id && styles.categoryOptionActive
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <View style={[styles.categoryOptionIcon, { backgroundColor: category.color }]}>
                      <IconComponent size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.categoryOptionText}>{category.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <TouchableOpacity
              style={styles.anonymousOption}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <View style={[styles.checkbox, isAnonymous && styles.checkboxActive]}>
                {isAnonymous && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.anonymousText}>Publicar de forma anónima</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddIntention}
              disabled={!newIntention.trim()}
            >
              <LinearGradient
                colors={['#8B5A2B', '#D4A574']}
                style={styles.submitButtonGradient}
              >
                <Text style={styles.submitButtonText}>Compartir Intención</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8DC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24, // Compensar el botón
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A2C2A',
  },
  statLabel: {
    fontSize: 12,
    color: '#8B5A2B',
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A2C2A',
    marginBottom: 16,
    textAlign: 'center',
  },
  intentionCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  intentionContent: {
    padding: 16,
  },
  intentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intentionMeta: {
    flex: 1,
    marginLeft: 12,
  },
  intentionAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A2C2A',
  },
  intentionDate: {
    fontSize: 12,
    color: '#8B5A2B',
  },
  prayerCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prayerCountText: {
    fontSize: 14,
    color: '#8B5A2B',
    marginLeft: 4,
    fontWeight: '600',
  },
  intentionText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#5D4037',
    marginBottom: 16,
  },
  prayButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  prayButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  prayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  groupCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  groupContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginLeft: 12,
  },
  groupMembers: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF8DC',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#8B5A2B',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A2C2A',
    marginBottom: 8,
  },
  intentionInput: {
    borderWidth: 1,
    borderColor: '#D4A574',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#4A2C2A',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryOptionActive: {
    borderColor: '#8B5A2B',
    backgroundColor: '#F0E68C',
  },
  categoryOptionIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#4A2C2A',
  },
  anonymousOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#8B5A2B',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#8B5A2B',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  anonymousText: {
    fontSize: 16,
    color: '#4A2C2A',
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  submitButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});