import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import ScreenLayout from '../../components/ScreenLayout';
import { Gamepad2, Users2, Trophy, Dice1, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface GameItem {
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}

const games: GameItem[] = [
  {
    name: 'Never Have I Ever',
    description: 'Classic drinking game to learn more about your friends',
    icon: Users2,
  },
  {
    name: 'Truth or Drink',
    description: 'Answer truthfully or take a drink',
    icon: Dice1,
  },
  {
    name: 'Kings Cup',
    description: 'Draw cards and follow the rules',
    icon: Trophy,
  },
  {
    name: 'More Coming Soon',
    description: 'Stay tuned for more fun party games!',
    icon: Gamepad2,
  },
];

export default function GamesScreen() {
  const router = useRouter();

  return (
    <ScreenLayout hideBackButton>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Party Games</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Choose a game to spice up your night!
          </Text>

          <ScrollView style={styles.gamesContainer}>
            {games.map((game, index) => {
              const Icon = game.icon;
              if (!Icon) {
                console.warn(`No icon found for game: ${game.name}`);
                return null;
              }
              
              return (
                <TouchableOpacity
                  key={game.name}
                  style={styles.gameCard}
                  onPress={() => {
                    // TODO: Implement game navigation
                    console.log(`Selected game: ${game.name}`);
                  }}>
                  <View style={styles.gameIconContainer}>
                    <Icon size={32} color="#fff" />
                  </View>
                  <View style={styles.gameInfo}>
                    <Text style={styles.gameName}>{game.name}</Text>
                    <Text style={styles.gameDescription}>{game.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
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
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    paddingBottom: 10,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    marginBottom: 30,
  },
  gamesContainer: {
    flex: 1,
  },
  gameCard: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  gameIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  gameDescription: {
    color: '#888',
    fontSize: 14,
  },
});
