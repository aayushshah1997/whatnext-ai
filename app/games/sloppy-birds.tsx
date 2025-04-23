import React from 'react';
import { View, StyleSheet } from 'react-native';
import SloppyBirds from '../../src/games/sloppy-birds/SloppyBirds';

export default function SloppyBirdsScreen() {
  return (
    <View style={styles.container}>
      <SloppyBirds />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
