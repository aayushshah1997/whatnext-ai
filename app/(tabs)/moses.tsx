import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenLayout from '../../components/ScreenLayout';

export default function MosesScreen() {
  return (
    <ScreenLayout>
      <View style={styles.content}>
        <Text style={styles.text}>Moses Screen - Coming Soon!</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter-Regular',
  },
});