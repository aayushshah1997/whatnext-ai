import React from 'react';
import { View, StyleSheet } from 'react-native';

interface BirdImageProps {
  color: string;
  style?: any;
  hasHat?: boolean;
  hasTie?: boolean;
  hasGlasses?: boolean;
}

export const BirdImage: React.FC<BirdImageProps> = ({ 
  color, 
  style, 
  hasHat = false,
  hasTie = false,
  hasGlasses = false
}) => {
  return (
    <View style={[styles.birdContainer, style]}>
      {/* Main bird body */}
      <View style={[styles.birdBody, { backgroundColor: color }]}>
        {/* Eyes */}
        {hasGlasses ? (
          <View style={styles.glasses}>
            <View style={styles.glassesLeft} />
            <View style={styles.glassesBridge} />
            <View style={styles.glassesRight} />
          </View>
        ) : (
          <>
            <View style={styles.eye} />
            <View style={styles.secondEye} />
          </>
        )}
        
        {/* Beak */}
        <View style={styles.beak} />
        
        {/* Hat if enabled */}
        {hasHat && (
          <View style={styles.hatContainer}>
            <View style={styles.hatBrim} />
            <View style={styles.hatTop} />
          </View>
        )}
        
        {/* Tie if enabled */}
        {hasTie && (
          <View style={styles.tie} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  birdContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  birdBody: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#000',
  },
  eye: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    position: 'absolute',
    top: '30%',
    left: '30%',
    borderWidth: 1,
    borderColor: '#000',
  },
  secondEye: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    position: 'absolute',
    top: '30%',
    right: '30%',
    borderWidth: 1,
    borderColor: '#000',
  },
  beak: {
    width: 25,
    height: 15,
    backgroundColor: '#e67e22',
    position: 'absolute',
    right: 0,
    top: '50%',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    borderWidth: 1,
    borderColor: '#d35400',
    transform: [{ translateY: -7.5 }],
  },
  hatContainer: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
  },
  hatBrim: {
    width: 60,
    height: 5,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  hatTop: {
    width: 40,
    height: 20,
    backgroundColor: '#333',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    position: 'absolute',
    top: -15,
  },
  glasses: {
    flexDirection: 'row',
    position: 'absolute',
    top: '30%',
    alignItems: 'center',
  },
  glassesLeft: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#000',
  },
  glassesBridge: {
    width: 10,
    height: 2,
    backgroundColor: '#000',
  },
  glassesRight: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#000',
  },
  tie: {
    width: 15,
    height: 25,
    backgroundColor: '#e74c3c',
    position: 'absolute',
    bottom: 5,
    borderWidth: 1,
    borderColor: '#c0392b',
    transform: [{ rotate: '10deg' }],
    borderRadius: 2,
  },
});
