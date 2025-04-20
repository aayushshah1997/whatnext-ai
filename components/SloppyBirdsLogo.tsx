import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

interface SloppyBirdsLogoProps {
  size?: number;
}

const SloppyBirdsLogo: React.FC<SloppyBirdsLogoProps> = ({ size = 80 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require('../assets/images/sloppy-birds-logo.png')}
        style={{ 
          width: size, 
          height: size, 
          resizeMode: 'cover',
          borderRadius: 12,
        }}
      />
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
});

export default SloppyBirdsLogo;