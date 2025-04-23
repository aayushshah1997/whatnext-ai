import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Asset } from 'expo-asset';

interface SloppyBirdsLogoProps {
  size?: number;
}

const SloppyBirdsLogo: React.FC<SloppyBirdsLogoProps> = ({ size = 80 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    // Preload the image when component mounts
    const preloadImage = async () => {
      try {
        await Asset.loadAsync(require('../assets/images/sloppy-birds-logo.png'));
        setImageLoaded(true);
      } catch (error) {
        console.error('Failed to preload Sloppy Birds logo:', error);
        // Set loaded anyway to avoid infinite loading state
        setImageLoaded(true);
      }
    };

    preloadImage();
  }, []);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {!imageLoaded ? (
        <View style={[styles.placeholderContainer, { width: size, height: size }]}>
          <ActivityIndicator size="small" color="#FFD700" />
        </View>
      ) : (
        <Image
          source={require('../assets/images/sloppy-birds-logo.png')}
          style={{ 
            width: size, 
            height: size, 
            resizeMode: 'cover',
            borderRadius: 12,
          }}
          // Add fadeDuration={0} to prevent fade-in animation
          fadeDuration={0}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 12,
  },
  placeholderContainer: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});

export default SloppyBirdsLogo;
