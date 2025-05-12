import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ResetStorageScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const resetStorage = async () => {
    setLoading(true);
    try {
      // Remove user profile from AsyncStorage
      await AsyncStorage.removeItem('user_profile');
      
      Alert.alert(
        'Storage Reset',
        'AsyncStorage has been cleared. The app will now create a new user with a proper UUID when you return to the settings screen.',
        [
          { 
            text: 'OK', 
            onPress: () => router.replace('/(tabs)') 
          }
        ]
      );
    } catch (error) {
      console.error('Error resetting storage:', error);
      Alert.alert('Error', 'Failed to reset storage. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = () => {
    Alert.alert(
      'Confirm Reset',
      'This will clear your local user data and create a new user with a proper UUID. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: resetStorage }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Reset Storage',
        headerShown: true,
      }} />
      
      <Text style={styles.heading}>Reset Local Storage</Text>
      <Text style={styles.description}>
        Your current user ID is not in the proper UUID format required by Supabase.
        This is why your profile updates are being saved to local storage instead of the database.
      </Text>
      <Text style={styles.description}>
        Resetting your local storage will allow the app to create a new user with a proper UUID format
        when you next visit the settings screen.
      </Text>
      
      <TouchableOpacity 
        style={styles.resetButton} 
        onPress={confirmReset}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Reset Storage</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    color: '#555',
    lineHeight: 24,
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
  },
  backButton: {
    backgroundColor: '#777',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
