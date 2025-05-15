import React from 'react';
import { View, StyleSheet } from 'react-native';
import SplitTheGWebView from '../../src/games/split-the-g/SplitTheGWebView';

export default function SplitTheGScreen() {
  return (
    <View style={styles.container}>
      <SplitTheGWebView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
