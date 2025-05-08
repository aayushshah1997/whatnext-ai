import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
// Import only what we need from supabaseClient
import { 
  testSupabaseConnection, 
  getOrCreateUser,
  supabaseUrl,
  supabaseAnonKey
} from '../src/lib/supabaseClient';
import ScreenLayout from '../components/ScreenLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import createClient directly to create a local instance
import { createClient } from '@supabase/supabase-js';

// Define error type interfaces
interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
}

interface ConnectionResult {
  success: boolean;
  error?: SupabaseError;
  stage?: string;
  details?: string;
}

export default function DatabaseTestScreen() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [userStorageMode, setUserStorageMode] = useState<string | null>(null);
  
  // Create a safer local Supabase client with custom storage implementation
  const createSafeSupabaseClient = () => {
    // Custom storage implementation with error handling
    const customStorage = {
      getItem: async (key: string) => {
        try {
          return await AsyncStorage.getItem(key);
        } catch (error) {
          console.error(`Error getting item ${key}:`, error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          await AsyncStorage.setItem(key, value);
        } catch (error) {
          console.error(`Error setting item ${key}:`, error);
        }
      },
      removeItem: async (key: string) => {
        try {
          await AsyncStorage.removeItem(key);
        } catch (error) {
          console.error(`Error removing item ${key}:`, error);
        }
      }
    };
    
    // Create a new client instance with the custom storage
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: customStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: { 'x-app-name': 'WhatNext-AI-Test' },
      },
    });
  };
  
  // Create the client reference that will be initialized only when needed
  const supabaseRef = useRef(createSafeSupabaseClient());

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Helper function to safely extract error message
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'object' && error !== null) {
      if ('message' in error) return error.message as string;
      if ('error' in error) return getErrorMessage(error.error);
    }
    return String(error || 'Unknown error');
  };

  // Helper function to safely extract error code
  const getErrorCode = (error: any): string => {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      return error.code as string;
    }
    return 'unknown';
  };

  const testConnection = async () => {
    try {
      setIsLoading(true);
      addLog('Testing Supabase connection...');
      
      const result = await testSupabaseConnection() as ConnectionResult;
      
      if (result.success) {
        setConnectionStatus('connected');
        addLog('✅ Connection successful!');
      } else {
        setConnectionStatus('error');
        const errorMessage = result.error ? getErrorMessage(result.error) : 'Unknown error';
        const errorCode = result.error ? getErrorCode(result.error) : 'unknown';
        
        addLog(`❌ Connection error: ${errorMessage}`);
        addLog(`Error code: ${errorCode}`);
        if (result.stage) {
          addLog(`Failed at stage: ${result.stage}`);
        }
        if (result.details) {
          addLog(`Details: ${result.details}`);
        }
      }
    } catch (error) {
      setConnectionStatus('error');
      addLog(`❌ Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testRlsPolicies = async () => {
    try {
      setIsLoading(true);
      addLog('Testing RLS policies...');
      
      // Test anonymous access to users table
      addLog('Testing anonymous SELECT on users table...');
      const { data: selectData, error: selectError } = await supabaseRef.current
        .from('users')
        .select('count(*)', { count: 'exact', head: true });
      
      if (selectError) {
        addLog(`❌ Anonymous SELECT failed: ${getErrorMessage(selectError)}`);
        addLog(`Error code: ${getErrorCode(selectError)}`);
      } else {
        addLog('✅ Anonymous SELECT works');
      }
      
      // Test anonymous insert
      addLog('Testing anonymous INSERT on users table...');
      const testUser = {
        id: crypto.randomUUID(),
        username: `test_${Math.random().toString(36).substring(2, 6)}`,
        created_at: new Date().toISOString()
      };
      
      const { data: insertData, error: insertError } = await supabaseRef.current
        .from('users')
        .insert(testUser)
        .select();
      
      if (insertError) {
        addLog(`❌ Anonymous INSERT failed: ${getErrorMessage(insertError)}`);
        addLog(`Error code: ${getErrorCode(insertError)}`);
      } else {
        addLog('✅ Anonymous INSERT works');
        
        // Test anonymous update
        addLog('Testing anonymous UPDATE on users table...');
        const { data: updateData, error: updateError } = await supabaseRef.current
          .from('users')
          .update({ username: `updated_${Math.random().toString(36).substring(2, 6)}` })
          .eq('id', testUser.id)
          .select();
        
        if (updateError) {
          addLog(`❌ Anonymous UPDATE failed: ${getErrorMessage(updateError)}`);
          addLog(`Error code: ${getErrorCode(updateError)}`);
        } else {
          addLog('✅ Anonymous UPDATE works');
        }
      }
    } catch (error) {
      addLog(`❌ Error testing RLS policies: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkApiKey = async () => {
    try {
      setIsLoading(true);
      addLog('Checking API key validity...');
      
      // Get the API key from supabaseClient.js
      const supabaseUrl = await AsyncStorage.getItem('supabase_url');
      const supabaseKey = await AsyncStorage.getItem('supabase_key');
      
      addLog(`URL: ${supabaseUrl || 'Using hardcoded URL'}`);
      addLog(`Key: ${supabaseKey ? '***' + supabaseKey.substring(supabaseKey.length - 5) : 'Using hardcoded key'}`);
      
      // Test a simple request to check if the key is valid
      const { data, error } = await supabaseRef.current.auth.getSession();
      
      if (error) {
        addLog(`❌ API key validation failed: ${getErrorMessage(error)}`);
      } else {
        addLog('✅ API key is valid');
      }
    } catch (error) {
      addLog(`❌ Error checking API key: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async () => {
    try {
      setIsLoading(true);
      addLog('Creating user...');
      
      const user = await getOrCreateUser();
      
      if (user) {
        setUserId(user.id);
        setUserStorageMode(user._storageMode || 'unknown');
        addLog(`✅ User created/retrieved: ${user.username}`);
        addLog(`User ID: ${user.id}`);
        addLog(`Storage mode: ${user._storageMode || 'unknown'}`);
      } else {
        addLog('❌ Failed to create user');
      }
    } catch (error) {
      addLog(`❌ Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testTables = async () => {
    try {
      setIsLoading(true);
      
      // Test each table
      const tables = [
        'users',
        'chat_messages',
        'drink_quiz_results',
        'game_sessions',
        'app_sessions',
        'hydration_events'
      ];
      
      addLog('Testing all tables...');
      
      for (const table of tables) {
        addLog(`Testing table: ${table}`);
        const { data, error } = await supabaseRef.current.from(table).select('count(*)', { count: 'exact', head: true });
        
        if (error) {
          addLog(`❌ Table ${table} error: ${getErrorMessage(error)}`);
          addLog(`Error code: ${getErrorCode(error)}`);
        } else {
          addLog(`✅ Table ${table} exists`);
        }
      }
      
      addLog('Table tests completed');
    } catch (error) {
      addLog(`❌ Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGameScore = async () => {
    if (!userId) {
      addLog('❌ Create a user first');
      return;
    }
    
    try {
      setIsLoading(true);
      addLog('Saving test game score...');
      
      const { data, error } = await supabaseRef.current
        .from('game_sessions')
        .insert({
          user_id: userId,
          game_name: 'Sloppy Birds',
          score: Math.floor(Math.random() * 100),
          metadata: { test: true }
        })
        .select();
      
      if (error) {
        addLog(`❌ Error saving score: ${getErrorMessage(error)}`);
        addLog(`Error code: ${getErrorCode(error)}`);
      } else {
        addLog(`✅ Score saved: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fixCommonIssues = async () => {
    try {
      setIsLoading(true);
      addLog('Attempting to fix common issues...');
      
      // 1. Check if tables exist, if not, suggest re-running SQL script
      const { data: usersData, error: usersError } = await supabaseRef.current
        .from('users')
        .select('count(*)', { count: 'exact', head: true });
      
      if (usersError && getErrorCode(usersError) === '42P01') {
        addLog('❌ Tables do not exist. Please run the SQL setup script in Supabase dashboard.');
        Alert.alert(
          'Tables Missing',
          'The database tables do not exist. Please run the SQL setup script in the Supabase dashboard.',
          [{ text: 'OK' }]
        );
      }
      
      // 2. Check RLS policies
      if (usersError && getErrorCode(usersError) === 'PGRST301') {
        addLog('❌ RLS policy issue detected. Attempting to fix...');
        // We can't fix RLS policies programmatically, but we can guide the user
        Alert.alert(
          'RLS Policy Issue',
          'Row Level Security policies are preventing access. Please check your Supabase dashboard and ensure anonymous access is enabled for all tables.',
          [{ text: 'OK' }]
        );
      }
      
      // 3. Check if we're in offline mode and try to reconnect
      const isOfflineMode = await AsyncStorage.getItem('offline_mode') === 'true';
      if (isOfflineMode) {
        addLog('ℹ️ App is in offline mode. Attempting to reconnect...');
        await AsyncStorage.removeItem('offline_mode');
        addLog('✅ Offline mode flag cleared. Please restart the app.');
      }
      
      addLog('Troubleshooting completed');
    } catch (error) {
      addLog(`❌ Error during troubleshooting: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check offline mode on component mount
    const checkOfflineMode = async () => {
      const isOffline = await AsyncStorage.getItem('offline_mode') === 'true';
      setOfflineMode(isOffline);
      
      // Also check for existing user
      const storedUserId = await AsyncStorage.getItem('user_id');
      if (storedUserId) {
        setUserId(storedUserId);
        
        // Try to get user storage mode
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setUserStorageMode(parsedUser._storageMode || 'unknown');
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }
      }
    };
    
    checkOfflineMode();
  }, []);

  useEffect(() => {
    addLog('Database test screen loaded');
    testConnection();
  }, []);

  return (
    <ScreenLayout title="Database Test" showBackButton>
      <View style={styles.container}>
        {/* Status Indicator */}
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Connection:</Text>
            <View style={[
              styles.statusIndicator, 
              connectionStatus === 'connected' ? styles.statusSuccess : 
              connectionStatus === 'error' ? styles.statusError : 
              styles.statusUnknown
            ]} />
            <Text style={styles.statusText}>
              {connectionStatus === 'connected' ? 'Connected' : 
               connectionStatus === 'error' ? 'Error' : 
               'Unknown'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Mode:</Text>
            <View style={[
              styles.statusIndicator, 
              offlineMode ? styles.statusWarning : styles.statusSuccess
            ]} />
            <Text style={styles.statusText}>
              {offlineMode ? 'Offline (AsyncStorage)' : 'Online (Supabase)'}
            </Text>
          </View>
          
          {userId && (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>User:</Text>
              <Text style={styles.statusText} numberOfLines={1} ellipsizeMode="middle">
                {userId} ({userStorageMode || 'unknown'})
              </Text>
            </View>
          )}
        </View>
        
        <ScrollView style={styles.logContainer}>
          {logs.map((log, index) => (
            <Text key={index} style={[
              styles.logText,
              log.includes('❌') ? styles.errorLog : 
              log.includes('✅') ? styles.successLog : 
              log.includes('ℹ️') ? styles.infoLog : 
              styles.normalLog
            ]}>
              {log}
            </Text>
          ))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={testConnection}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Connection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={testTables}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Tables</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={testRlsPolicies}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test RLS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={checkApiKey}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Check API Key</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={createUser}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Create User</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={saveGameScore}
            disabled={isLoading || !userId}
          >
            <Text style={styles.buttonText}>Save Game Score</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.warningButton]} 
            onPress={fixCommonIssues}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Fix Common Issues</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.dangerButton]} 
            onPress={clearLogs}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#121212',
  },
  statusContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    color: '#BBBBBB',
    width: 90,
    fontSize: 14,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusSuccess: {
    backgroundColor: '#4CAF50',
  },
  statusError: {
    backgroundColor: '#F44336',
  },
  statusWarning: {
    backgroundColor: '#FF9800',
  },
  statusUnknown: {
    backgroundColor: '#9E9E9E',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  logText: {
    color: '#BBBBBB',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  errorLog: {
    color: '#F44336',
  },
  successLog: {
    color: '#4CAF50',
  },
  infoLog: {
    color: '#2196F3',
  },
  normalLog: {
    color: '#BBBBBB',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  loadingText: {
    color: '#FFFFFF',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    width: '48%',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
  },
  secondaryButton: {
    backgroundColor: '#424242',
  },
  warningButton: {
    backgroundColor: '#FF9800',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
