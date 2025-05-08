import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { supabase, testSupabaseConnection, supabaseUrl, supabaseAnonKey } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HealthCheckResult {
  success: boolean;
  error?: any;
  stage?: string;
  details?: string;
  data?: any;
}

const SupabaseHealthCheck = () => {
  const [isChecking, setIsChecking] = useState(true);
  const [result, setResult] = useState<HealthCheckResult | null>(null);
  const [offlineMode, setOfflineMode] = useState<boolean>(false);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [expandedConfig, setExpandedConfig] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    setResult(null);

    try {
      // Force clear offline mode
      await AsyncStorage.removeItem('offline_mode');
      console.log('Cleared offline_mode flag during health check');
      setOfflineMode(false);

      // Test the connection
      const connectionResult = await testSupabaseConnection();
      setResult(connectionResult);

      // If connection successful, do a simple query to verify data access
      if (connectionResult.success) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('count(*)', { count: 'exact', head: true });
          
          if (error) {
            console.error('Data access check failed:', error);
            setResult({
              ...connectionResult,
              success: false,
              error,
              stage: 'data_access',
              details: `Connection succeeded but data access failed: ${error.message}`
            });
          } else {
            console.log('Data access check succeeded:', data);
            
            // Force clear offline mode again after successful check
            await AsyncStorage.removeItem('offline_mode');
            
            setResult({
              ...connectionResult,
              data
            });
          }
        } catch (err) {
          const error = err as Error;
          console.error('Data access check exception:', error);
          setResult({
            ...connectionResult,
            success: false,
            error,
            stage: 'data_access_exception',
            details: `Connection succeeded but data access threw an exception: ${error.message}`
          });
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('Health check exception:', error);
      setResult({
        success: false,
        error,
        stage: 'health_check_exception',
        details: `Health check threw an exception: ${error.message}`
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Force clear offline mode on component mount
    AsyncStorage.removeItem('offline_mode')
      .then(() => console.log('Cleared offline_mode flag on SupabaseHealthCheck mount'))
      .catch(err => console.error('Error clearing offline mode flag:', err));
    
    checkConnection();
  }, []);

  const getStatusText = () => {
    if (isChecking) return 'Checking Supabase connection...';
    if (!result) return 'No result';
    
    if (result.success) {
      return '✅ Supabase connection successful';
    } else {
      if (offlineMode) {
        return '⚠️ App was in offline mode - now cleared';
      }
      
      switch (result.stage) {
        case 'connection':
          return '❌ Failed to connect to Supabase';
        case 'table_access':
          return '❌ Connected to Supabase but failed to access tables';
        case 'data_access':
          return '❌ Connected to Supabase but failed to query data';
        default:
          return '❌ Supabase connection failed';
      }
    }
  };

  const getErrorDetails = () => {
    if (!result || !result.error) return null;
    
    return (
      <View style={styles.errorDetails}>
        <Text style={styles.errorTitle}>Error Details:</Text>
        <Text style={styles.errorCode}>Code: {result.error.code || 'N/A'}</Text>
        <Text style={styles.errorMessage}>Message: {result.error.message || 'No message'}</Text>
        {result.details && (
          <Text style={styles.errorHint}>Hint: {result.details}</Text>
        )}
      </View>
    );
  };

  const getConfigDetails = () => {
    return (
      <View style={styles.configDetails}>
        <Text style={styles.configTitle}>Configuration:</Text>
        <Text style={styles.configItem}>Supabase URL: {supabaseUrl}</Text>
        <Text style={styles.configItem}>Anon Key (first 8 chars): {supabaseAnonKey.substring(0, 8)}...</Text>
        <Text style={styles.configItem}>Offline Mode: {offlineMode ? 'Enabled (will be cleared)' : 'Disabled'}</Text>
        <Text style={styles.configItem}>Debug Mode: {(supabase as any).debug ? 'Enabled' : 'Disabled'}</Text>
      </View>
    );
  };

  const getRecommendations = () => {
    if (!result || result.success) return null;
    
    let recommendations: string[] = [];
    
    if (result.stage === 'connection') {
      recommendations = [
        'Check your internet connection',
        'Verify the Supabase URL is correct',
        'Ensure your Supabase project is active',
        'Verify the anon key is valid'
      ];
    } else if (result.stage === 'table_access' || result.stage === 'data_access') {
      recommendations = [
        'Ensure the database tables are created correctly',
        'Check Row Level Security (RLS) policies',
        'Verify the anon key has appropriate permissions',
        'Run the database setup script if tables are missing'
      ];
    }
    
    if (offlineMode) {
      recommendations.unshift('App was in offline mode - now cleared. Try again.');
    }
    
    return (
      <View style={styles.recommendations}>
        <Text style={styles.recommendationsTitle}>Recommendations:</Text>
        {recommendations.map((rec, index) => (
          <Text key={index} style={styles.recommendationItem}>• {rec}</Text>
        ))}
        <TouchableOpacity 
          style={styles.forceOnlineButton}
          onPress={async () => {
            await AsyncStorage.removeItem('offline_mode');
            setOfflineMode(false);
            checkConnection();
          }}
        >
          <Text style={styles.forceOnlineButtonText}>Force Online Mode & Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Health Check</Text>
      
      <View style={styles.statusContainer}>
        <Text style={[
          styles.statusText,
          result && result.success ? styles.successText : (offlineMode ? styles.warningText : styles.errorText)
        ]}>
          {getStatusText()}
        </Text>
      </View>
      
      {isChecking ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <ScrollView style={styles.detailsContainer}>
          <TouchableOpacity 
            style={styles.detailsToggle}
            onPress={() => setExpandedConfig(!expandedConfig)}
          >
            <Text style={styles.detailsToggleText}>
              {expandedConfig ? '▼ Hide Configuration' : '▶ Show Configuration'}
            </Text>
          </TouchableOpacity>
          
          {expandedConfig && getConfigDetails()}
          
          {!result?.success && (
            <>
              <TouchableOpacity 
                style={styles.detailsToggle}
                onPress={() => setExpandedDetails(!expandedDetails)}
              >
                <Text style={styles.detailsToggleText}>
                  {expandedDetails ? '▼ Hide Error Details' : '▶ Show Error Details'}
                </Text>
              </TouchableOpacity>
              
              {expandedDetails && getErrorDetails()}
              {expandedDetails && getRecommendations()}
            </>
          )}
          
          {result?.success && result?.data && (
            <View style={styles.dataDetails}>
              <Text style={styles.dataTitle}>Data Access:</Text>
              <Text style={styles.dataItem}>✅ Successfully queried the database</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={checkConnection}
            disabled={isChecking}
          >
            <Text style={styles.retryButtonText}>
              {isChecking ? 'Checking...' : 'Check Again'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  statusContainer: {
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
  warningText: {
    color: '#FFC107',
  },
  detailsContainer: {
    maxHeight: 300,
  },
  detailsToggle: {
    padding: 10,
    backgroundColor: '#333333',
    borderRadius: 4,
    marginVertical: 5,
  },
  detailsToggleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  errorDetails: {
    backgroundColor: '#2C2C2C',
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
  },
  errorTitle: {
    color: '#F44336',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  errorCode: {
    color: '#E0E0E0',
    marginBottom: 2,
  },
  errorMessage: {
    color: '#E0E0E0',
    marginBottom: 2,
  },
  errorHint: {
    color: '#E0E0E0',
    fontStyle: 'italic',
  },
  configDetails: {
    backgroundColor: '#2C2C2C',
    padding: 10,
    borderRadius: 4,
    marginTop: 5,
  },
  configTitle: {
    color: '#64B5F6',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  configItem: {
    color: '#E0E0E0',
    marginBottom: 2,
  },
  dataDetails: {
    backgroundColor: '#2C2C2C',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  dataTitle: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  dataItem: {
    color: '#E0E0E0',
  },
  recommendations: {
    backgroundColor: '#2C2C2C',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  recommendationsTitle: {
    color: '#FFC107',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  recommendationItem: {
    color: '#E0E0E0',
    marginBottom: 2,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 15,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  forceOnlineButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 15,
  },
  forceOnlineButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SupabaseHealthCheck;
