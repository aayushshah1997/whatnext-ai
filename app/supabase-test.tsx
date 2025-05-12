import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useSupabase } from '../src/lib/supabase/SupabaseProvider';
import { supabase, testSupabaseConnection, getOrCreateUser, saveGameScore } from '../src/lib/supabase/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SupabaseTestScreen() {
  const { isOnline, currentUser, refreshUser, connectionMessage } = useSupabase();
  const [testResults, setTestResults] = useState<Array<{ name: string; status: 'success' | 'error' | 'pending'; message: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    // Test 1: Connection Test
    try {
      addTestResult('Connection Test', 'pending', 'Testing connection to Supabase...');
      const { success, message } = await testSupabaseConnection();
      addTestResult('Connection Test', success ? 'success' : 'error', message);
    } catch (error) {
      addTestResult('Connection Test', 'error', `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test 2: Table Existence
    try {
      addTestResult('Table Existence', 'pending', 'Checking if required tables exist...');
      const tables = ['users', 'chat_messages', 'drink_quiz_results', 'game_sessions', 'app_sessions', 'hydration_events'];
      let allTablesExist = true;
      let missingTables: string[] = [];
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
          
        if (error) {
          allTablesExist = false;
          missingTables.push(table);
        }
      }
      
      if (allTablesExist) {
        addTestResult('Table Existence', 'success', 'All required tables exist');
      } else {
        addTestResult('Table Existence', 'error', `Missing tables: ${missingTables.join(', ')}`);
      }
    } catch (error) {
      addTestResult('Table Existence', 'error', `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test 3: User Creation
    try {
      addTestResult('User Creation', 'pending', 'Testing user creation or retrieval...');
      
      // Get or create user using the improved function that ensures one user per device
      const user = await getOrCreateUser();
      
      // Check if we already had a stored user ID
      const storedId = await AsyncStorage.getItem('user_id');
      
      if (user) {
        if (storedId && storedId === user.id) {
          addTestResult('User Creation', 'success', `Existing user retrieved with ID: ${user.id}`);
        } else {
          addTestResult('User Creation', 'success', `New user created with ID: ${user.id}`);
        }
      } else {
        addTestResult('User Creation', 'error', 'Failed to create or retrieve user');
      }
    } catch (error) {
      addTestResult('User Creation', 'error', `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test 4: Game Score Saving
    try {
      addTestResult('Game Score Saving', 'pending', 'Testing game score saving...');
      
      if (!currentUser) {
        addTestResult('Game Score Saving', 'error', 'No current user found. Please create a user first.');
      } else {
        const gameData = {
          user_id: currentUser.id,
          game_name: 'test_game',
          score: Math.floor(Math.random() * 100),
          metadata: { level: 1, time: 60 }
        };
        
        const result = await saveGameScore(gameData);
        
        if (result) {
          addTestResult('Game Score Saving', 'success', `Game score saved with ID: ${result.id}`);
        } else {
          addTestResult('Game Score Saving', 'error', 'Failed to save game score');
        }
      }
    } catch (error) {
      addTestResult('Game Score Saving', 'error', `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Test 5: AsyncStorage Fallback
    try {
      addTestResult('AsyncStorage Fallback', 'pending', 'Testing AsyncStorage fallback...');
      
      // Check if AsyncStorage is working
      await AsyncStorage.setItem('test_key', 'test_value');
      const value = await AsyncStorage.getItem('test_key');
      
      if (value === 'test_value') {
        addTestResult('AsyncStorage Fallback', 'success', 'AsyncStorage is working correctly');
      } else {
        addTestResult('AsyncStorage Fallback', 'error', 'AsyncStorage test failed');
      }
    } catch (error) {
      addTestResult('AsyncStorage Fallback', 'error', `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    setIsLoading(false);
  };
  
  const addTestResult = (name: string, status: 'success' | 'error' | 'pending', message: string) => {
    setTestResults(prev => {
      // Remove any existing test with the same name
      const filtered = prev.filter(test => test.name !== name);
      // Add the new test result
      return [...filtered, { name, status, message }];
    });
  };
  
  const clearAsyncStorage = async () => {
    try {
      setIsLoading(true);
      await AsyncStorage.clear();
      alert('AsyncStorage cleared successfully');
      await refreshUser();
    } catch (error) {
      alert(`Error clearing AsyncStorage: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Supabase Diagnostics' }} />
      
      <View style={styles.statusContainer}>
        <Text style={styles.title}>Backend Status</Text>
        <View style={[styles.statusIndicator, { backgroundColor: isOnline ? '#4CAF50' : '#F44336' }]} />
        <Text style={styles.statusText}>
          {isOnline ? 'Connected to Supabase' : 'Using AsyncStorage Fallback'}
        </Text>
        <Text style={styles.message}>{connectionMessage}</Text>
      </View>
      
      <View style={styles.userContainer}>
        <Text style={styles.title}>Current User</Text>
        {currentUser ? (
          <View>
            <Text style={styles.userInfo}>Username: {currentUser.username}</Text>
            <Text style={styles.userInfo}>Name: {currentUser.first_name} {currentUser.last_name}</Text>
            <Text style={styles.userInfo}>Email: {currentUser.email}</Text>
            <Text style={styles.userInfo}>ID: {currentUser.id}</Text>
          </View>
        ) : (
          <Text style={styles.noUser}>No user found</Text>
        )}
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.disabledButton]} 
          onPress={runTests}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Run Diagnostic Tests</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton, isLoading && styles.disabledButton]} 
          onPress={clearAsyncStorage}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Clear Local Storage</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        <Text style={styles.title}>Test Results</Text>
        {testResults.length === 0 && !isLoading ? (
          <Text style={styles.noResults}>No tests run yet</Text>
        ) : (
          testResults.map((test, index) => (
            <View key={index} style={styles.testResult}>
              <View style={styles.testHeader}>
                <Text style={styles.testName}>{test.name}</Text>
                <View style={[
                  styles.testStatus, 
                  test.status === 'success' ? styles.successStatus : 
                  test.status === 'error' ? styles.errorStatus : 
                  styles.pendingStatus
                ]} />
              </View>
              <Text style={styles.testMessage}>{test.message}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  message: {
    marginTop: 4,
    textAlign: 'center',
    color: '#666',
  },
  userContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  userInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  noUser: {
    fontStyle: 'italic',
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    opacity: 0.7,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  noResults: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  testResult: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  testName: {
    fontWeight: '500',
  },
  testStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  successStatus: {
    backgroundColor: '#4CAF50',
  },
  errorStatus: {
    backgroundColor: '#F44336',
  },
  pendingStatus: {
    backgroundColor: '#FFC107',
  },
  testMessage: {
    fontSize: 12,
    color: '#666',
  },
});
