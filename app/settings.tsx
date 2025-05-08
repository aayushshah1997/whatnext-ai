import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getOrCreateUser, updateUserProfile } from '../src/lib/supabaseClient';
import ScreenLayout from '../components/ScreenLayout';
import { Users } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [storageMode, setStorageMode] = useState('unknown');

  useEffect(() => {
    AsyncStorage.removeItem('offline_mode')
      .then(() => console.log('Cleared offline mode flag on settings screen mount'))
      .catch(err => console.error('Error clearing offline mode flag:', err));
    
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setStatusMessage('Loading your profile...');
      
      await AsyncStorage.removeItem('offline_mode');
      setIsOfflineMode(false);
      
      const user = await getOrCreateUser();
      
      if (user) {
        setUserId(user.id);
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        setEmail(user.email || '');
        setUsername(user.username || '');
        
        setStorageMode('supabase');
        setIsOfflineMode(false);
        setStatusMessage('');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      
      try {
        const userId = await AsyncStorage.getItem('user_id');
        const userData = await AsyncStorage.getItem('user_data');
        
        if (userId && userData) {
          const user = JSON.parse(userData);
          setUserId(userId);
          setFirstName(user.first_name || '');
          setLastName(user.last_name || '');
          setEmail(user.email || '');
          setUsername(user.username || '');
        }
      } catch (e) {
        console.error('Failed to load from AsyncStorage:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveUserData = async () => {
    try {
      setSaving(true);
      
      let updatedUsername = username;
      if (!updatedUsername) {
        updatedUsername = `user_${Math.random().toString(36).substring(2, 6)}`;
        setUsername(updatedUsername);
      }
      
      const profileData = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        username: updatedUsername,
        updated_at: new Date().toISOString()
      };
      
      await AsyncStorage.removeItem('offline_mode');
      
      const result = await updateUserProfile(userId, profileData);
      
      if (result) {
        Alert.alert('Success', 'Profile updated successfully');
        
        setIsOfflineMode(false);
        setStatusMessage('');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenLayout>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollContainer}>
          <Text style={styles.title}>Profile Settings</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter your first name"
              placeholderTextColor="#666"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter your last name"
              placeholderTextColor="#666"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter your username"
              placeholderTextColor="#666"
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              {!username ? "A random username will be generated if left empty" : ""}
            </Text>
          </View>
          
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.savingButton]}
            onPress={saveUserData}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.sectionDivider} />
          
          <Text style={styles.sectionTitle}>Social</Text>
          
          <TouchableOpacity
            style={styles.featureButton}
            onPress={() => router.push('/friends')}
          >
            <View style={styles.featureButtonContent}>
              <Users size={24} color="#fff" />
              <Text style={styles.featureButtonText}>Friends</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  helperText: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  savingButton: {
    backgroundColor: '#2980b9',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  featureButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  featureButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
