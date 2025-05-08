import 'react-native-url-polyfill/auto';
import { useEffect, useRef, useState } from 'react';
import { Slot } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { getOrCreateUser, trackAppSession } from '../src/lib/supabaseClient';
import { AppState, AppStateStatus } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();
  
  // State for user and session tracking
  const [userId, setUserId] = useState<string | null>(null);
  const appSessionRef = useRef<{ endSession: () => Promise<number> } | null>(null);
  const appState = useRef(AppState.currentState);

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  // Initialize user and start session tracking
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Get or create user
        const user = await getOrCreateUser();
        setUserId(user.id);
        
        // Start session tracking
        if (user.id) {
          console.log('Starting app session tracking for user:', user.id);
          const session = await trackAppSession(user.id);
          appSessionRef.current = session;
        }
      } catch (error) {
        console.error('Error initializing user or session tracking:', error);
      }
    };
    
    initializeUser();
    
    // Set up app state change listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Clean up on unmount
    return () => {
      subscription.remove();
      endCurrentSession();
    };
  }, []);
  
  // Handle app state changes (foreground, background, inactive)
  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // If app is going to background or inactive, end the current session
    if (
      appState.current === 'active' && 
      (nextAppState === 'background' || nextAppState === 'inactive')
    ) {
      await endCurrentSession();
    } 
    // If app is coming back to foreground, start a new session
    else if (
      (appState.current === 'background' || appState.current === 'inactive') && 
      nextAppState === 'active' && 
      userId && 
      !appSessionRef.current
    ) {
      try {
        console.log('Restarting app session tracking for user:', userId);
        const session = await trackAppSession(userId);
        appSessionRef.current = session;
      } catch (error) {
        console.error('Error restarting session tracking:', error);
      }
    }
    
    // Update app state reference
    appState.current = nextAppState;
  };
  
  // Helper function to end the current session
  const endCurrentSession = async () => {
    if (appSessionRef.current) {
      try {
        console.log('Ending app session');
        const durationSeconds = await appSessionRef.current.endSession();
        console.log(`Session ended. Duration: ${durationSeconds} seconds`);
        appSessionRef.current = null;
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <Slot />
      <StatusBar style="light" />
    </View>
  );
}