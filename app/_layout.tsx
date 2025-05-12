import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import SupabaseProvider from '@/src/lib/supabase/SupabaseProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    // Initialize app session tracking
    const trackAppSession = async () => {
      try {
        const sessionStart = new Date().toISOString();
        await AsyncStorage.setItem('current_session_start', sessionStart);
      } catch (error) {
        console.error('Error tracking app session:', error);
      }
    };

    trackAppSession();

    return () => {
      // Clean up or finalize session tracking if needed
    };
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SupabaseProvider>
      <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
        <Slot />
        <StatusBar style="light" />
      </View>
    </SupabaseProvider>
  );
}