import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Alert, SafeAreaView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import ScreenLayout from '../../components/ScreenLayout';
import { AIService } from '../../config/ai';
import { Music, DollarSign, Users, MapPin, X, ChevronLeft } from 'lucide-react-native';

interface BarPreferences {
  vibeType: string;
  budget: string;
  groupSize: string;
  musicPreference?: string;
}

export default function BarsScreen() {
  const [showPreferences, setShowPreferences] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [preferences, setPreferences] = useState<BarPreferences>({
    vibeType: '',
    budget: '',
    groupSize: '',
  });
  const [recommendation, setRecommendation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = async () => {
    setLoading(true);
    setError(null);
    try {
      const aiService = AIService.getInstance();
      const result = await aiService.generateBarRecommendation({
        location: 'New York City', // TODO: Get from user's location
        preferences,
        userContext: {
          time: new Date().toLocaleTimeString(),
        }
      });
      
      setRecommendation(result);
      setShowPreferences(false);
      setShowRecommendation(true);
    } catch (error) {
      console.error('Error getting bar recommendation:', error);
      setError('Unable to get a recommendation. Please try again.');
      Alert.alert(
        'Error',
        'Unable to get a bar recommendation. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout hideBackButton>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Link href="/" asChild>
            <TouchableOpacity style={styles.backButton}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          </Link>
          <Text style={styles.title}>Bars Near You</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Find Your Perfect Bar</Text>
          <Text style={styles.subtitle}>Tell us what you're looking for</Text>

          <ScrollView style={styles.preferencesContainer}>
            {/* Vibe Type */}
            <View style={styles.preferenceSection}>
              <View style={styles.sectionHeader}>
                <Music size={24} color="#fff" />
                <Text style={styles.sectionTitle}>Vibe</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['Chill', 'Energetic', 'Upscale', 'Dive Bar', 'Sports'].map((vibe) => (
                  <TouchableOpacity
                    key={vibe}
                    style={[
                      styles.optionButton,
                      preferences.vibeType === vibe && styles.selectedOption,
                    ]}
                    onPress={() => setPreferences({ ...preferences, vibeType: vibe })}>
                    <Text style={[
                      styles.optionText,
                      preferences.vibeType === vibe && styles.selectedOptionText,
                    ]}>{vibe}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Budget */}
            <View style={styles.preferenceSection}>
              <View style={styles.sectionHeader}>
                <DollarSign size={24} color="#fff" />
                <Text style={styles.sectionTitle}>Budget</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['$', '$$', '$$$', '$$$$'].map((budget) => (
                  <TouchableOpacity
                    key={budget}
                    style={[
                      styles.optionButton,
                      preferences.budget === budget && styles.selectedOption,
                    ]}
                    onPress={() => setPreferences({ ...preferences, budget })}>
                    <Text style={[
                      styles.optionText,
                      preferences.budget === budget && styles.selectedOptionText,
                    ]}>{budget}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Group Size */}
            <View style={styles.preferenceSection}>
              <View style={styles.sectionHeader}>
                <Users size={24} color="#fff" />
                <Text style={styles.sectionTitle}>Group Size</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['Solo', 'Couple', 'Small Group', 'Large Group'].map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.optionButton,
                      preferences.groupSize === size && styles.selectedOption,
                    ]}
                    onPress={() => setPreferences({ ...preferences, groupSize: size })}>
                    <Text style={[
                      styles.optionText,
                      preferences.groupSize === size && styles.selectedOptionText,
                    ]}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TouchableOpacity
              style={[
                styles.findButton,
                (!preferences.vibeType || !preferences.budget || !preferences.groupSize) && styles.disabledButton
              ]}
              disabled={!preferences.vibeType || !preferences.budget || !preferences.groupSize}
              onPress={getRecommendation}>
              <Text style={styles.findButtonText}>Find My Bar</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Recommendation Modal */}
          <Modal
            visible={showRecommendation}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowRecommendation(false)}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowRecommendation(false)}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>

                <ScrollView style={styles.recommendationContainer}>
                  <Text style={styles.modalTitle}>Your Bar Recommendation</Text>
                  {loading ? (
                    <Text style={styles.text}>Finding the perfect bar for you...</Text>
                  ) : error ? (
                    <>
                      <Text style={styles.errorText}>{error}</Text>
                      <TouchableOpacity 
                        style={styles.button}
                        onPress={getRecommendation}>
                        <Text style={styles.buttonText}>Try Again</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 30,
  },
  preferencesContainer: {
    flex: 1,
  },
  preferenceSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    marginLeft: 10,
  },
  optionButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  selectedOption: {
    backgroundColor: '#fff',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  selectedOptionText: {
    color: '#1a1a1a',
  },
  findButton: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  findButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendationContainer: {
    marginTop: 50,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  recommendationText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
});