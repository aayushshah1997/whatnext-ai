import React from 'react';
import { View, StyleSheet } from 'react-native';
import Matter from 'matter-js';

type ObstacleProps = {
  body: Matter.Body;
  size: [number, number];
  color: string;
  type: 'cocktail' | 'beer' | 'wine';
  scored: boolean;
};

export const Obstacle = (props: ObstacleProps) => {
  const width = props.size[0];
  const height = props.size[1];
  const x = props.body.position.x - width / 2;
  const y = props.body.position.y - height / 2;

  // Different styles based on obstacle type
  const getObstacleStyle = () => {
    switch (props.type) {
      case 'cocktail':
        return {
          backgroundColor: '#e74c3c',
          borderColor: '#c0392b',
          borderRadius: 10,
          borderWidth: 2,
        };
      case 'beer':
        return {
          backgroundColor: '#f39c12',
          borderColor: '#d35400',
          borderRadius: 5,
          borderWidth: 2,
        };
      case 'wine':
        return {
          backgroundColor: '#8e44ad',
          borderColor: '#6c3483',
          borderRadius: 15,
          borderWidth: 2,
        };
      default:
        return {
          backgroundColor: props.color,
          borderRadius: 10,
        };
    }
  };

  return (
    <View
      style={[
        styles.obstacle,
        getObstacleStyle(),
        {
          left: x,
          top: y,
          width: width,
          height: height,
        },
      ]}
    >
      {/* Inner details to make it look like a drink */}
      {props.type === 'cocktail' && (
        <View style={styles.cocktailDetails}>
          <View style={styles.cocktailStraw} />
        </View>
      )}
      
      {props.type === 'beer' && (
        <View style={styles.beerFoam} />
      )}
      
      {props.type === 'wine' && (
        <View style={styles.wineGlass} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  obstacle: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  cocktailDetails: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cocktailStraw: {
    position: 'absolute',
    top: -5,
    right: 10,
    width: 4,
    height: 20,
    backgroundColor: '#fff',
    transform: [{ rotate: '15deg' }],
  },
  beerFoam: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  wineGlass: {
    position: 'absolute',
    bottom: 0,
    left: 5,
    right: 5,
    height: '70%',
    backgroundColor: 'rgba(136, 14, 79, 0.7)',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});
