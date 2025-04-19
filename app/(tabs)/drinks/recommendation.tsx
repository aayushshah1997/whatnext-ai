import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RecommendationScreen() {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendation();
  }, []);

  const loadRecommendation = async () => {
    try {
      const rec = await AsyncStorage.getItem('lastRecommendation');
      if (rec) {
        setRecommendation(rec);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading recommendation:', error);
      setLoading(false);
    }
  };

  const openRecipe = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening recipe:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Moses AI is thinking...</Text>
      </View>
    );
  }

  // Parse recommendation to find the drink name and recipe URL
  const drinkMatch = recommendation.match(/\*\*(.*?)\*\*/);
  const drinkName = drinkMatch ? drinkMatch[1] : 'Recommended Drink';
  const urlMatch = recommendation.match(/\((https?:\/\/[^\s)]+)\)/);
  const recipeUrl = urlMatch ? urlMatch[1] : '';

  return (
    <View style={styles.container}>
      <Text style={styles.vibe}>{recommendation}</Text>
      
      {recipeUrl && (
        <TouchableOpacity 
          style={styles.button}
          onPress={() => openRecipe(recipeUrl)}>
          <Text style={styles.buttonText}>View Recipe</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={[styles.button, styles.startOverButton]}
        onPress={() => router.push('/drinks')}>
        <Text style={styles.buttonText}>Start Over</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    fontFamily: 'Inter-Regular',
  },
  vibe: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 30,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 15,
  },
  startOverButton: {
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Bold',
  },
});