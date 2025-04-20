import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

interface BackButtonProps {
  onPress?: () => void;
  testID?: string;
}

const BackButton = ({ onPress, testID = 'backButton' }: BackButtonProps) => {
  const router = useRouter();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };
  
  return (
    <TouchableOpacity 
      style={styles.backButton} 
      onPress={handlePress}
      activeOpacity={0.7}
      testID={testID}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
    >
      <ArrowLeft size={24} color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    elevation: 5, // For Android
  },
});

export default BackButton;
