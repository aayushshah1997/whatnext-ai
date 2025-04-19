import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import ConnectionManager from '../src/components/ConnectionManager';

export default function RootLayout() {
  useFrameworkReady();

  const [fontsLoaded] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Bold': Inter_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <ConnectionManager />
      <Slot />
      <StatusBar style="light" />
    </View>
  );
}