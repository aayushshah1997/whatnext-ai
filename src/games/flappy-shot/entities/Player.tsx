import React from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import Matter from 'matter-js';
import { BirdImage } from './BirdImage';

type PlayerProps = {
  body: Matter.Body;
  size: [number, number];
  color: string;
  isPoweredUp: boolean;
  hasCustomImage?: boolean;
  imageSource?: any;
  birdType?: string;
  lives?: number;
  isInvincible?: boolean;
  isWobbling?: boolean;
  isFalling?: boolean;
  wobbleAnim?: Animated.Value;
};

export const Player = (props: PlayerProps) => {
  const width = props.size[0];
  const height = props.size[1];
  const x = props.body.position.x - width / 2;
  const y = props.body.position.y - height / 2;
  const angle = props.body.angle;
  
  // Apply wobble animation if active
  const wobbleTransform = props.wobbleAnim ? 
    [{ rotate: props.wobbleAnim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: ['-15deg', '0deg', '15deg']
    })}] : [];
  
  // Apply falling animation if active
  const fallingTransform = props.isFalling ? 
    [{ rotate: '90deg' }] : 
    [{ rotate: angle + 'rad' }];
  
  // Combine transforms based on state
  const transforms = props.isWobbling ? 
    wobbleTransform : 
    fallingTransform;

  return (
    <Animated.View
      style={[
        styles.player,
        {
          left: x,
          top: y,
          width: width,
          height: height,
          transform: transforms,
          backgroundColor: props.hasCustomImage ? 'transparent' : (props.isInvincible ? '#f39c12' : props.color),
          borderColor: props.isInvincible ? '#f1c40f' : '#2980b9',
          shadowColor: props.isInvincible ? '#f39c12' : '#2980b9',
        },
      ]}
    >
      {props.hasCustomImage && props.imageSource ? (
        <Image 
          source={props.imageSource} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      ) : (
        <>
          {/* Bird face details */}
          <View style={styles.birdEye} />
          <View style={styles.birdSecondEye} />
          <View style={styles.birdBeak} />
          
          {/* Wing */}
          <View style={styles.wing} />
        </>
      )}
      
      {/* Lives indicator */}
      <View style={styles.livesContainer}>
        {Array.from({ length: props.lives || 0 }).map((_, index) => (
          <View key={index} style={styles.lifePoint} />
        ))}
      </View>
      
      {/* Invincibility effect */}
      {props.isInvincible && (
        <View style={styles.invincibilityGlow} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  player: {
    position: 'absolute',
    borderRadius: 30,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100, // Ensure player is above other elements
  },
  birdEye: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    top: 15,
    right: 15,
    borderWidth: 1,
    borderColor: '#000',
  },
  birdSecondEye: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    top: 15,
    right: 35,
    borderWidth: 1,
    borderColor: '#000',
  },
  birdBeak: {
    position: 'absolute',
    width: 20,
    height: 12,
    backgroundColor: '#e67e22',
    borderRadius: 5,
    transform: [{ rotate: '45deg' }],
    right: 5,
    top: 25,
    borderWidth: 1,
    borderColor: '#d35400',
  },
  wing: {
    position: 'absolute',
    width: 25,
    height: 15,
    backgroundColor: '#2980b9',
    borderRadius: 10,
    left: 10,
    bottom: 15,
    borderWidth: 1,
    borderColor: '#1c6391',
    transform: [{ rotate: '-20deg' }],
  },
  invincibilityGlow: {
    position: 'absolute',
    width: '160%',
    height: '160%',
    borderRadius: 50,
    backgroundColor: 'rgba(243, 156, 18, 0.3)',
    zIndex: -1,
  },
  livesContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 101,
  },
  lifePoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e74c3c',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: '#fff',
  },
});
