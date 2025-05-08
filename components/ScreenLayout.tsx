import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

interface ScreenLayoutProps {
  children: React.ReactNode;
  hideBackButton?: boolean;
  showBackButton?: boolean;
  title?: string;
}

export default function ScreenLayout({ 
  children, 
  hideBackButton = false, 
  showBackButton = false,
  title 
}: ScreenLayoutProps) {
  const router = useRouter();
  const shouldShowBackButton = showBackButton || !hideBackButton;

  return (
    <View style={styles.container}>
      {shouldShowBackButton && (
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
      )}
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{title}</Text>
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    paddingTop: 70,
    paddingBottom: 10,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
