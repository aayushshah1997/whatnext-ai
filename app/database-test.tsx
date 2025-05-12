import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase/supabaseClient';
// Custom UUID generator for React Native (RFC4122 version 4 compliant)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DatabaseTestScreen() {
  const router = useRouter();
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const clearLogs = () => {
    setResults([]);
  };

  const testConnection = async () => {
    setLoading(true);
    clearLogs();
    try {
      addLog('Testing Supabase connection...');
      
      // Test the connection by getting the server time
      const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact' });
      
      if (error) {
        addLog(`❌ Connection error: ${error.message}`);
      } else {
        addLog('✅ Connected to Supabase successfully!');
        addLog(`Current users count: ${data.length}`);
      }

      // Check environment variables
      addLog('\nChecking environment variables:');
      addLog(`SUPABASE_URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
      addLog(`SUPABASE_ANON_KEY: ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
      
      // Check AsyncStorage
      addLog('\nChecking AsyncStorage:');
      const storedUser = await AsyncStorage.getItem('user_profile');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        addLog('✅ User data found in AsyncStorage:');
        addLog(JSON.stringify(userData, null, 2));
      } else {
        addLog('❌ No user data in AsyncStorage');
      }
    } catch (error) {
      addLog(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    setLoading(true);
    clearLogs();
    try {
      addLog('Creating test user in Supabase...');
      
      // Generate a proper UUID
      const userId = generateUUID();
      const username = `test_${Math.random().toString(36).substring(2, 6)}`;
      
      // Create user directly with Supabase client
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            username: username,
            first_name: 'Test',
            last_name: 'User',
            email: `${username}@example.com`,
            created_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (error) {
        addLog(`❌ Error creating user: ${error.message}`);
      } else {
        addLog('✅ Test user created successfully!');
        addLog(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      addLog(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const saveGameScore = async () => {
    setLoading(true);
    clearLogs();
    try {
      addLog('Saving test game score...');
      
      // Get user from AsyncStorage
      const storedUser = await AsyncStorage.getItem('user_profile');
      if (!storedUser) {
        addLog('❌ No user found in AsyncStorage');
        return;
      }
      
      const userData = JSON.parse(storedUser);
      addLog(`Using user: ${userData.username} (${userData.id})`);
      
      // Check if user ID is a valid UUID
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userData.id);
      addLog(`User ID is ${isValidUUID ? 'a valid' : 'NOT a valid'} UUID`);
      
      if (!isValidUUID) {
        addLog('Creating a new user with valid UUID...');
        const newUserId = generateUUID();
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert([
            {
              id: newUserId,
              username: userData.username || `user_${Math.random().toString(36).substring(2, 6)}`,
              first_name: userData.first_name,
              last_name: userData.last_name,
              email: userData.email,
              created_at: new Date().toISOString()
            }
          ])
          .select();
          
        if (createError) {
          addLog(`❌ Error creating new user: ${createError.message}`);
          return;
        }
        
        addLog('✅ New user created with valid UUID');
        userData.id = newUserId;
      }
      
      // Save game score
      const { data, error } = await supabase
        .from('game_sessions')
        .insert([
          {
            user_id: userData.id,
            game_name: 'Sloppy Birds',
            score: Math.floor(Math.random() * 100),
            metadata: { level: 1, duration: 120 }
          }
        ])
        .select();
      
      if (error) {
        addLog(`❌ Error saving game score: ${error.message}`);
      } else {
        addLog('✅ Game score saved successfully!');
        addLog(JSON.stringify(data, null, 2));
      }
    } catch (error) {
      addLog(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Database Test',
        headerShown: true,
      }} />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={testConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={createTestUser}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Create Test User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={saveGameScore}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Save Game Score</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        {loading && <Text style={styles.loadingText}>Loading...</Text>}
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#777',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
  },
  loadingText: {
    color: '#ffcc00',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 4,
  },
});
