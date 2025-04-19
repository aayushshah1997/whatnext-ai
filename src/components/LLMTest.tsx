import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { fetchLLMResponse } from '../utils/fetchLLMResponse';

export default function LLMTest() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testLLM = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLLMResponse({
        system: "You are a helpful assistant.",
        user: "Say hello and introduce yourself in one short sentence.",
      });
      setResponse(result);
    } catch (err) {
      console.error('Error testing LLM:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.button}
        onPress={testLLM}
        disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? 'Testing...' : 'Test LLM Integration'}
        </Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator style={styles.loader} color="#fff" />
      )}

      {error && (
        <Text style={styles.error}>{error}</Text>
      )}

      {response && (
        <Text style={styles.response}>{response}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Bold',
  },
  loader: {
    marginTop: 20,
  },
  error: {
    color: '#ff6b6b',
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  response: {
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,
  },
});
