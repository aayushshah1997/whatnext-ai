import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, Image, Animated, ActivityIndicator } from 'react-native';
import ScreenLayout from '../../components/ScreenLayout';
import { Gamepad2, Users2, Trophy, Dice1, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Asset } from 'expo-asset';

// Import the Sloppy Birds logo
const sloppyBirdsLogo = require('../../assets/images/sloppy-birds-logo.png');

interface GameItem {
  name: string;
  description: string;
  icon?: React.ComponentType<any>;
  customImage?: any;
  route?: string;
}

const games: GameItem[] = [
  {
    name: 'Sloppy Birds',
    description: 'Avoid drinks and collect power-ups in this addictive mini-game',
    customImage: sloppyBirdsLogo, // Using the imported logo image
    route: '/games/sloppy-birds', // Updated route to match the new game name
  },
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
  const [logoLoaded, setLogoLoaded] = useState(false);

  // Animation values for pulsating effect on the featured game
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;

  // Preload the Sloppy Birds logo
  useEffect(() => {
    const preloadLogo = async () => {
      try {
        await Asset.loadAsync(sloppyBirdsLogo);
        setLogoLoaded(true);
      } catch (error) {
        console.error('Failed to preload Sloppy Birds logo:', error);
        // Set loaded anyway to avoid infinite loading state
        setLogoLoaded(true);
      }
    };
    
    preloadLogo();
  }, []);

  // Start pulsating animation
  useEffect(() => {
    // Create pulsating animation sequence
    const pulseAnimation = Animated.loop(
      Animated.parallel([
        // Scale animation
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        // Opacity animation
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0.9,
            duration: 1800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Start the animation
    pulseAnimation.start();

    // Clean up animation on unmount
    return () => {
      pulseAnimation.stop();
    };
  }, []);

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
              const ImageSource = game.customImage;
              if (!Icon && !ImageSource) {
                console.warn(`No icon or image found for game: ${game.name}`);
                return null;
              }
              
              // Check if this is the Sloppy Birds game
              const isSloppyBirds = game.name === 'Sloppy Birds';
              
              // For Sloppy Birds, always use the logo image regardless of what's in the game object
              const useSloppyBirdsLogo = isSloppyBirds;
              const imageSource = useSloppyBirdsLogo ? sloppyBirdsLogo : game.customImage;
              
              return (
                <TouchableOpacity
                  key={game.name}
                  style={[
                    styles.gameCard,
                    isSloppyBirds ? styles.featuredGameCard : null,
                  ]}
                  onPress={() => {
                    if (game.route) {
                      router.push(game.route);
                    }
                  }}>
                  {isSloppyBirds ? (
                    <Animated.View 
                      style={[
                        styles.gameIconContainer,
                        styles.featuredIconContainer,
                        {
                          transform: [{ scale: pulseScale }],
                          opacity: pulseOpacity
                        }
                      ]}
                    >
                      {!logoLoaded ? (
                        <View style={styles.logoPlaceholder}>
                          <ActivityIndicator size="large" color="#fff" />
                        </View>
                      ) : (
                        <Image 
                          source={sloppyBirdsLogo}
                          style={{
                            width: 95,
                            height: 95,
                            resizeMode: 'contain',
                            borderRadius: 12,
                          }}
                          fadeDuration={0}
                        />
                      )}
                    </Animated.View>
                  ) : Icon ? (
                    <View style={styles.gameIconContainer}>
                      <Icon size={32} color="#fff" />
                    </View>
                  ) : imageSource ? (
                    <View style={styles.gameIconContainer}>
                      <Image 
                        source={imageSource} 
                        style={{
                          width: 50,
                          height: 50,
                          resizeMode: 'contain'
                        }} 
                      />
                    </View>
                  ) : null}
                  <View style={styles.gameInfo}>
                    <Text style={[
                      styles.gameName,
                      isSloppyBirds ? styles.featuredGameName : null
                    ]}>{game.name}</Text>
                    <Text style={[
                      styles.gameDescription,
                      isSloppyBirds ? styles.featuredGameDescription : null
                    ]}>{game.description}</Text>
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
  featuredGameCard: {
    backgroundColor: '#222',
    padding: 25,
    marginBottom: 25,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
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
  featuredIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'hidden',
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
  featuredGameName: {
    fontSize: 22,
    color: '#e74c3c',
  },
  gameDescription: {
    color: '#888',
    fontSize: 14,
  },
  featuredGameDescription: {
    fontSize: 16,
    color: '#ccc',
  },
  logoPlaceholder: {
    width: 95,
    height: 95,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
