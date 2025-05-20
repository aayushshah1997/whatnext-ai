import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import ScreenLayout from '../../components/ScreenLayout';

export default function GamesIndexScreen() {
  const router = useRouter();

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Games</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Select a game from the menu to play
          </Text>
          
          <TouchableOpacity 
            style={styles.gameButton}
            onPress={() => router.push('/games/sloppy-birds')}
          >
            <Text style={styles.buttonText}>Sloppy Birds</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.gameButton}
            onPress={() => router.push('/games/split-the-g')}
          >
            <Text style={styles.buttonText}>Split the G</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  gameButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginVertical: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
