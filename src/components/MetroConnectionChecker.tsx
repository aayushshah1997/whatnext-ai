import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import Constants from 'expo-constants';

// Only show in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;

const MetroConnectionChecker = () => {
  const [isMetroConnected, setIsMetroConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Only run this in development mode
    if (!isDevelopment) return;

    let timeoutId: NodeJS.Timeout | undefined;
    let intervalId: NodeJS.Timeout;

    const checkMetroConnection = async () => {
      try {
        setIsChecking(true);
        
        // Try to fetch a resource from the Metro bundler
        // This will fail if Metro is not running
        const response = await fetch('http://localhost:8081/status');
        
        if (response.ok) {
          setIsMetroConnected(true);
          setIsChecking(false);
          // If we were previously disconnected, reload the app
          if (!isMetroConnected && retryCount > 0) {
            // Give a moment for the connection to stabilize
            setTimeout(() => {
              if (Platform.OS === 'web') {
                window.location.reload();
              }
              // For native platforms, the HMR should handle this
            }, 1000);
          }
        } else {
          setIsMetroConnected(false);
          setIsChecking(false);
        }
      } catch (error) {
        console.log('Metro connection check failed:', error);
        setIsMetroConnected(false);
        setIsChecking(false);
      }
    };

    // Initial check
    checkMetroConnection();

    // Set up periodic checks
    intervalId = setInterval(() => {
      checkMetroConnection();
      setRetryCount(prev => prev + 1);
    }, 5000); // Check every 5 seconds

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [isMetroConnected]);

  // Don't render anything if we're not in development or if Metro is connected
  if (!isDevelopment || isMetroConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.title}>Metro Bundler Not Connected</Text>
        <Text style={styles.message}>
          The development server appears to be offline. Please make sure Metro is running:
        </Text>
        <View style={styles.codeBlock}>
          <Text style={styles.code}>npx expo start --tunnel</Text>
          <Text style={styles.code}>- or -</Text>
          <Text style={styles.code}>./start-dev.sh</Text>
        </View>
        <View style={styles.statusContainer}>
          {isChecking ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.statusText}>Checking connection...</Text>
            </>
          ) : (
            <Text style={styles.statusText}>
              Retry {retryCount}: Waiting for Metro to become available...
            </Text>
          )}
        </View>
      </View>
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
    backgroundColor: '#e74c3c',
    padding: 16,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 8,
  },
});

export default MetroConnectionChecker;
