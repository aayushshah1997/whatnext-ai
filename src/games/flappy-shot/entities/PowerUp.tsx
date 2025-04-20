import React from 'react';
import { View, StyleSheet } from 'react-native';
import Matter from 'matter-js';

type PowerUpProps = {
  body: Matter.Body;
  size: [number, number];
  collected: boolean;
};

export const PowerUp = (props: PowerUpProps) => {
  const width = props.size[0];
  const height = props.size[1];
  const x = props.body.position.x - width / 2;
  const y = props.body.position.y - height / 2;

  if (props.collected) {
    return null;
  }

  return (
    <View
      style={[
        styles.powerUp,
        {
          left: x,
          top: y,
          width: width,
          height: height,
        },
      ]}
    >
      {/* Inner details to make it look like a powder bag */}
      <View style={styles.bagFold} />
      <View style={styles.bagShine} />
    </View>
  );
};

const styles = StyleSheet.create({
  powerUp: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  bagFold: {
    position: 'absolute',
    top: 5,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 1,
  },
  bagShine: {
    position: 'absolute',
    top: 10,
    right: 5,
    width: 8,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 4,
  },
});
