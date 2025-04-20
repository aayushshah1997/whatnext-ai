import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, SafeAreaView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScreenLayoutProps {
  children: React.ReactNode;
  hideBackButton?: boolean;
  title?: string;
}

export default function ScreenLayout({ children, hideBackButton = false, title }: ScreenLayoutProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Calculate top padding based on safe area insets
  const topPadding = Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 0;
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Back button */}
      {!hideBackButton && (
        <View style={[
          styles.backButtonContainer, 
          { top: Math.max(topPadding + 10, 20) }
        ]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            testID="backButton">
            <ArrowLeft size={24} color="#fff" />
            {title && <Text style={styles.backButtonText}>{title}</Text>}
          </TouchableOpacity>
        </View>
      )}
      
      {/* Content container with padding to ensure content falls below back button */}
      <View style={[
        styles.contentContainer,
        !hideBackButton && styles.contentWithBackButton
      ]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 100, // Ensure it's above all content
    elevation: 5, // For Android shadow
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 51, 51, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  backButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
  contentWithBackButton: {
    paddingTop: 60, // Ensure content falls below back button
  },
});
