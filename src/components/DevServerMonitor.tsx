import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import { API_CONFIG } from '../utils/config';

// Only show in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;

type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'api_error';

const DevServerMonitor = () => {
  const [status, setStatus] = useState<ConnectionStatus>('checking');
  const [retryCount, setRetryCount] = useState(0);
  const [apiKeyStatus, setApiKeyStatus] = useState<'valid' | 'missing' | 'unknown'>('unknown');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Only run this in development mode
    if (!isDevelopment) return;

    // Check API key status
    if (!API_CONFIG.TOGETHER_API_KEY) {
      setApiKeyStatus('missing');
    } else {
      setApiKeyStatus('valid');
    }

    let intervalId: NodeJS.Timeout;

    const checkMetroConnection = async () => {
      try {
        // In development on a physical device, we can't directly check localhost
        // So we'll assume Metro is connected if the app is running
        if (Platform.OS !== 'web') {
          setStatus('connected');
          return;
        }
        
        // Only try to fetch from localhost if we're on web
        const metroPort = Constants.expoConfig?.extra?.METRO_PORT || '8081';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        try {
          const response = await fetch(`http://localhost:${metroPort}/status`, { 
            signal: controller.signal 
          });
          
          if (response.ok) {
            setStatus('connected');
            
            // Now check API connectivity
            try {
              const apiController = new AbortController();
              const apiTimeoutId = setTimeout(() => apiController.abort(), 5000);
              
              const apiResponse = await fetch(`${API_CONFIG.API_BASE_URL}/models`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${API_CONFIG.TOGETHER_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                signal: apiController.signal
              });
              
              clearTimeout(apiTimeoutId);
              
              if (!apiResponse.ok) {
                setStatus('api_error');
              }
            } catch (apiError) {
              console.log('API connection check failed:', apiError);
              setStatus('api_error');
            }
          } else {
            setStatus('disconnected');
          }
        } finally {
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.log('Metro connection check failed:', error);
        setStatus('disconnected');
      }
      
      setRetryCount(prev => prev + 1);
    };

    // Initial check
    checkMetroConnection();

    // Set up periodic checks
    intervalId = setInterval(checkMetroConnection, 10000); // Check every 10 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleRestart = () => {
    // Open terminal instructions in a browser
    Linking.openURL('https://docs.expo.dev/get-started/installation/#requirements');
  };

  // Don't render anything if we're not in development or if everything is connected
  if (!isDevelopment || (status === 'connected' && apiKeyStatus === 'valid')) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Pressable 
        style={[
          styles.banner, 
          status === 'api_error' ? styles.apiErrorBanner : 
          status === 'disconnected' ? styles.disconnectedBanner : 
          apiKeyStatus === 'missing' ? styles.configErrorBanner : 
          styles.checkingBanner
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.headerRow}>
          <View style={styles.statusIndicator}>
            {status === 'checking' && <ActivityIndicator size="small" color="#fff" />}
            {status === 'connected' && apiKeyStatus === 'missing' && <Text style={styles.statusIcon}>⚠️</Text>}
            {status === 'disconnected' && <Text style={styles.statusIcon}>❌</Text>}
            {status === 'api_error' && <Text style={styles.statusIcon}>⚠️</Text>}
          </View>
          
          <Text style={styles.title}>
            {status === 'checking' && 'Checking Development Server...'}
            {status === 'connected' && apiKeyStatus === 'missing' && 'API Key Missing'}
            {status === 'disconnected' && 'Metro Bundler Not Connected'}
            {status === 'api_error' && 'API Connection Error'}
          </Text>
          
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        </View>
        
        {isExpanded && (
          <View style={styles.detailsContainer}>
            {status === 'disconnected' && (
              <>
                <Text style={styles.message}>
                  The Metro bundler appears to be offline. Please start it with:
                </Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>npx expo start --tunnel</Text>
                  <Text style={styles.code}>- or -</Text>
                  <Text style={styles.code}>npm run start:dev</Text>
                </View>
                <Pressable style={styles.button} onPress={handleRestart}>
                  <Text style={styles.buttonText}>View Troubleshooting Guide</Text>
                </Pressable>
              </>
            )}
            
            {status === 'api_error' && (
              <>
                <Text style={styles.message}>
                  Connected to Metro, but unable to reach the Together AI API.
                </Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>1. Check your internet connection</Text>
                  <Text style={styles.code}>2. Verify API_BASE_URL in .env</Text>
                  <Text style={styles.code}>3. Check if Together AI is operational</Text>
                </View>
              </>
            )}
            
            {status === 'connected' && apiKeyStatus === 'missing' && (
              <>
                <Text style={styles.message}>
                  Metro is connected, but your Together API key is missing.
                </Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>1. Create a .env file in the project root</Text>
                  <Text style={styles.code}>2. Add TOGETHER_API_KEY=your_key_here</Text>
                  <Text style={styles.code}>3. Restart the development server</Text>
                </View>
              </>
            )}
            
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                Check #{retryCount} • Metro: {status === 'connected' ? 'Connected ✓' : 'Disconnected ✗'} • 
                API Key: {apiKeyStatus === 'valid' ? 'Valid ✓' : apiKeyStatus === 'missing' ? 'Missing ✗' : 'Unknown ?'}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  banner: {
    padding: 12,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  checkingBanner: {
    backgroundColor: '#3498db',
  },
  disconnectedBanner: {
    backgroundColor: '#e74c3c',
  },
  apiErrorBanner: {
    backgroundColor: '#f39c12',
  },
  configErrorBanner: {
    backgroundColor: '#9b59b6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 18,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  expandIcon: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  detailsContainer: {
    marginTop: 12,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  codeBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  code: {
    color: '#fff',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    marginBottom: 4,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    textAlign: 'center',
  },
});

export default DevServerMonitor;
