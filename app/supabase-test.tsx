import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { testSupabaseConnection, supabase, supabaseUrl, supabaseAnonKey } from '../src/lib/supabaseClient';
import ScreenLayout from '../components/ScreenLayout';
import SupabaseHealthCheck from '../src/components/SupabaseHealthCheck';

export default function SupabaseTestScreen() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedTests, setShowAdvancedTests] = useState(false);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  const runConnectionTest = async () => {
    try {
      setIsLoading(true);
      addLog('Starting Supabase connection test...');
      
      const result = await testSupabaseConnection();
      
      if (result.success) {
        addLog(`✅ Connection test successful: ${result.message}`);
      } else {
        addLog(`❌ Connection test failed: ${result.error}`);
        addLog(`Error details: ${result.details || 'No details available'}`);
        if (result.recommendation) {
          addLog(`Recommendation: ${result.recommendation}`);
        }
      }
    } catch (error: any) {
      addLog(`❌ Test error: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsersTable = async () => {
    try {
      setIsLoading(true);
      addLog('Checking users table...');
      
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) {
        addLog(`❌ Users table error: ${error.message}`);
        addLog(`Error details: ${JSON.stringify(error)}`);
      } else {
        addLog(`✅ Users table accessible, found ${count} records`);
        if (data && data.length > 0) {
          addLog(`First user: ${JSON.stringify(data[0])}`);
        } else {
          addLog('No users found in the table');
        }
      }
    } catch (error: any) {
      addLog(`❌ Users table error: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestUser = async () => {
    try {
      setIsLoading(true);
      addLog('Creating test user...');
      
      const testUsername = `test_${Math.random().toString(36).substring(2, 6)}`;
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: testUsername,
          created_at: new Date().toISOString(),
        })
        .select();
      
      if (error) {
        addLog(`❌ Create user error: ${error.message}`);
        addLog(`Error details: ${JSON.stringify(error)}`);
      } else {
        addLog(`✅ Test user created: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      addLog(`❌ Create user error: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Log Supabase configuration on mount
    addLog(`Supabase URL: ${supabaseUrl}`);
    addLog(`Supabase Key (first 10): ${supabaseAnonKey.substring(0, 10)}...`);
    addLog(`Debug Mode: ${(supabase as any).debug ? 'ON' : 'OFF'}`);
  }, []);

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <Text style={styles.title}>Supabase Connection Test</Text>
        
        {/* Health Check Component */}
        <SupabaseHealthCheck />
        
        <TouchableOpacity 
          style={styles.advancedToggle}
          onPress={() => setShowAdvancedTests(!showAdvancedTests)}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvancedTests ? '▼ Hide Advanced Tests' : '▶ Show Advanced Tests'}
          </Text>
        </TouchableOpacity>
        
        {showAdvancedTests && (
          <>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, isLoading && styles.disabledButton]} 
                onPress={runConnectionTest}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Test Connection</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, isLoading && styles.disabledButton]} 
                onPress={checkUsersTable}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Check Users Table</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, isLoading && styles.disabledButton]} 
                onPress={createTestUser}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Create Test User</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.logContainer}>
              {testResults.map((log, index) => (
                <Text key={index} style={styles.logText}>{log}</Text>
              ))}
              {isLoading && <Text style={styles.loadingText}>Loading...</Text>}
            </ScrollView>
          </>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  advancedToggle: {
    backgroundColor: '#333333',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  advancedToggleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#2c3e50',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#2c3e50',
    borderRadius: 5,
    padding: 10,
  },
  logText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 5,
  },
  loadingText: {
    color: '#3498db',
    fontStyle: 'italic',
  },
});
