import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenLayout from '../../components/ScreenLayout';

export default function FoodScreen() {
  return (
    <ScreenLayout>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Food 🍽️</Text>
          <Text style={styles.comingSoon}>Coming soon...</Text>
          <Text style={styles.description}>
            We're cooking up something special! Soon you'll be able to discover amazing food recommendations and pairings.
          </Text>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  comingSoon: {
    fontSize: 24,
    color: '#2C3E50',
    fontWeight: 'bold',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '80%',
  },
});
