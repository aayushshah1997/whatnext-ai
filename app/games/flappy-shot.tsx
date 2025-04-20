import React from 'react';
import { View, StyleSheet } from 'react-native';
import SloppyBirds from '../../src/games/flappy-shot/SloppyBirds';

export default function SloppyBirdsScreen() {
  return (
    <View style={styles.container}>
      {/* Game component */}
      <SloppyBirds />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});
