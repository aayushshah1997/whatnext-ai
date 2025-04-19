import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import Constants from 'expo-constants';
import * as Network from 'expo-network';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../utils/config';

// Connection types
type ConnectionMode = 'tunnel' | 'lan' | 'local';
type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'error';

// Connection settings interface
interface ConnectionSettings {
  mode: ConnectionMode;
  lastSuccessful: ConnectionMode | null;
  autoRetry: boolean;
}

// Default settings
const DEFAULT_SETTINGS: ConnectionSettings = {
  mode: 'tunnel', // Default to tunnel mode
  lastSuccessful: null,
  autoRetry: true,
};

// Storage key
const STORAGE_KEY = 'what_next_connection_settings';

export const ConnectionManager = () => {
  const [expanded, setExpanded] = useState(false);
  const [metroStatus, setMetroStatus] = useState<ConnectionStatus>('checking');
  const [apiStatus, setApiStatus] = useState<ConnectionStatus>('checking');
  const [settings, setSettings] = useState<ConnectionSettings>(DEFAULT_SETTINGS);
  const [isRetrying, setIsRetrying] = useState(false);
  const [networkType, setNetworkType] = useState<string>('unknown');

  // Load saved settings
  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Failed to load connection settings:', error);
    }
  }, []);

  // Save settings
  const saveSettings = useCallback(async (newSettings: ConnectionSettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save connection settings:', error);
    }
  }, []);

  // Check Metro bundler connection
  const checkMetroConnection = useCallback(async () => {
    try {
      setMetroStatus('checking');
      
      // On physical devices, we can't directly check localhost
      // So we assume Metro is connected if the app is running
      if (Platform.OS !== 'web') {
        // For physical devices, we'll consider it connected if we can reach the API
        // This is a simplification since we can't easily check Metro from the device
        setMetroStatus('connected');
        return true;
      }
      
      // For web, we can check the Metro bundler directly
      const metroPort = Constants.expoConfig?.extra?.METRO_PORT || '8081';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`http://localhost:${metroPort}/status`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setMetroStatus('connected');
        return true;
      } else {
        setMetroStatus('error');
        return false;
      }
    } catch (error) {
      console.log('Metro connection check failed:', error);
      setMetroStatus('disconnected');
      return false;
    }
  }, []);

  // Check API connection
  const checkApiConnection = useCallback(async () => {
    try {
      setApiStatus('checking');
      
      // Simple check to see if we can reach the API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_CONFIG.API_BASE_URL}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_CONFIG.TOGETHER_API_KEY}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setApiStatus('connected');
        return true;
      } else {
        setApiStatus('error');
        return false;
      }
    } catch (error) {
      console.log('API connection check failed:', error);
      setApiStatus('disconnected');
      return false;
    }
  }, []);

  // Check network type
  const checkNetworkType = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      setNetworkType(networkState.type || 'unknown');
    } catch (error) {
      console.error('Failed to get network type:', error);
      setNetworkType('unknown');
    }
  }, []);

  // Automatic retry logic
  const retryConnection = useCallback(async () => {
    setIsRetrying(true);
    
    // Try different connection modes in order of preference
    const modes: ConnectionMode[] = ['tunnel', 'lan', 'local'];
    
    // Start with the current mode, then try others
    const currentIndex = modes.indexOf(settings.mode);
    const orderedModes = [
      ...modes.slice(currentIndex),
      ...modes.slice(0, currentIndex)
    ];
    
    for (const mode of orderedModes) {
      console.log(`Trying connection mode: ${mode}`);
      
      // Update settings to try this mode
      const newSettings = { ...settings, mode };
      await saveSettings(newSettings);
      
      // Wait a moment for the connection to establish
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check connections
      const metroConnected = await checkMetroConnection();
      const apiConnected = await checkApiConnection();
      
      if (metroConnected && apiConnected) {
        console.log(`Connection successful with mode: ${mode}`);
        await saveSettings({
          ...newSettings,
          lastSuccessful: mode,
        });
        break;
      }
    }
    
    setIsRetrying(false);
  }, [settings, checkMetroConnection, checkApiConnection, saveSettings]);

  // Change connection mode
  const changeConnectionMode = useCallback((mode: ConnectionMode) => {
    saveSettings({ ...settings, mode });
  }, [settings, saveSettings]);

  // Initial setup
  useEffect(() => {
    loadSettings();
    checkNetworkType();
    
    const checkConnections = async () => {
      await checkMetroConnection();
      await checkApiConnection();
    };
    
    checkConnections();
    
    // Set up periodic checking
    const interval = setInterval(checkConnections, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [loadSettings, checkMetroConnection, checkApiConnection, checkNetworkType]);

  // Auto-retry when disconnected
  useEffect(() => {
    if (
      settings.autoRetry && 
      !isRetrying && 
      (metroStatus === 'disconnected' || apiStatus === 'disconnected')
    ) {
      retryConnection();
    }
  }, [metroStatus, apiStatus, settings.autoRetry, isRetrying, retryConnection]);

  // Render status indicator
  const renderStatusIndicator = (status: ConnectionStatus, label: string) => {
    let color = '#999';
    let statusText = 'Checking...';
    
    switch (status) {
      case 'connected':
        color = '#4CAF50';
        statusText = 'Connected';
        break;
      case 'disconnected':
        color = '#F44336';
        statusText = 'Disconnected';
        break;
      case 'error':
        color = '#FF9800';
        statusText = 'Error';
        break;
      case 'checking':
        color = '#2196F3';
        statusText = 'Checking...';
        break;
    }
    
    return (
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={styles.statusLabel}>{label}</Text>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
    );
  };

  // Render connection mode buttons
  const renderConnectionModes = () => {
    return (
      <View style={styles.modeContainer}>
        {(['tunnel', 'lan', 'local'] as ConnectionMode[]).map((mode) => (
          <TouchableOpacity
            key={mode}
            style={[
              styles.modeButton,
              settings.mode === mode && styles.activeModeButton,
            ]}
            onPress={() => changeConnectionMode(mode)}
          >
            <Text style={[
              styles.modeButtonText,
              settings.mode === mode && styles.activeModeButtonText,
            ]}>
              {mode.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render troubleshooting tips
  const renderTroubleshooting = () => {
    if (!expanded) return null;
    
    return (
      <View style={styles.troubleshootingContainer}>
        <Text style={styles.troubleshootingTitle}>Troubleshooting Tips:</Text>
        
        <Text style={styles.troubleshootingItem}>
          • Network: You're on {networkType} network
        </Text>
        
        <Text style={styles.troubleshootingItem}>
          • Connection Mode: {settings.mode.toUpperCase()}
        </Text>
        
        <Text style={styles.troubleshootingItem}>
          • If using LAN mode, ensure your device and development machine are on the same network
        </Text>
        
        <Text style={styles.troubleshootingItem}>
          • For tunnel mode, ensure you have internet connectivity
        </Text>
        
        <Text style={styles.troubleshootingItem}>
          • Try restarting the Expo development server with:
          {'\n'}  npx expo start --tunnel --clear
        </Text>
        
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={retryConnection}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.retryButtonText}>Try All Connection Modes</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={styles.title}>Connection Status</Text>
        <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      <View style={styles.content}>
        {renderStatusIndicator(metroStatus, 'Metro Bundler:')}
        {renderStatusIndicator(apiStatus, 'API Server:')}
        {renderConnectionModes()}
        {renderTroubleshooting()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    margin: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#333',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  expandIcon: {
    color: '#fff',
    fontSize: 14,
  },
  content: {
    padding: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusLabel: {
    color: '#ccc',
    width: 120,
    fontSize: 14,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
  },
  modeContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
  },
  modeButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    backgroundColor: '#333',
    marginHorizontal: 4,
    borderRadius: 4,
  },
  activeModeButton: {
    backgroundColor: '#1976D2',
  },
  modeButtonText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeModeButtonText: {
    color: '#fff',
  },
  troubleshootingContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  troubleshootingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  troubleshootingItem: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ConnectionManager;
