import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, StatusBar, Alert, Animated as RNAnimated, TouchableWithoutFeedback, Image, ScrollView } from 'react-native';
import { GameEngine } from 'react-native-game-engine';
import Matter from 'matter-js';
import { Player, Obstacle, PowerUp } from './entities';
import { Background } from './components/Background';
import { CreateObstacle } from './systems/CreateObstacle';
import { CreatePowerUp } from './systems/CreatePowerUp';
import { MoveObjects } from './systems/MoveObjects';
import { RemoveObjects } from './systems/RemoveObjects';
import { PowerUpSystem } from './systems/PowerUpSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BirdImage } from './entities/BirdImage';
import { setupWorldWithBird, GameLogicSystem, GAME_CONSTANTS } from './utils/GameLogic';

const { width, height } = Dimensions.get('window');

// Player constants
const PLAYER_SIZE = 90;     // Size of the player bird (px) - increased by 50% from 60
const PLAYER_COLOR = '#3498db'; // Blue color for the player
const INITIAL_PLAYER_POSITION = { x: width / 4, y: height / 2 };

// Bird character options
const BIRD_CHARACTERS = [
  { id: 'yellow', color: 'transparent', name: 'Finance bro', hasCustomImage: true, imageSource: require('./assets/financebro.png') },
  { id: 'rasta', color: 'transparent', name: 'Rasta bro', hasCustomImage: true, imageSource: require('./assets/rastabro.png') },
  { id: 'artsy', color: 'transparent', name: 'Artsy bro', hasCustomImage: true, imageSource: require('./assets/artsybro.png') },
];

const SloppyBirds = () => {
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isInvincible, setIsInvincible] = useState(false);
  const [entities, setEntities] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'countdown' | 'playing' | 'gameover'>('menu');
  const [selectedBird, setSelectedBird] = useState(BIRD_CHARACTERS[0]);
  const [currentBirdIndex, setCurrentBirdIndex] = useState(0);
  const gameEngineRef = useRef<GameEngine>(null);
  const countdownAnim = useRef(new RNAnimated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const birdPreviewPosition = useRef({ x: 0, y: 0 });
  const birdPreviewRef = useRef(null);
  const wobbleAnim = useRef(new RNAnimated.Value(0)).current;
  
  // Animation values for smooth transitions
  const menuFadeAnim = useRef(new RNAnimated.Value(1)).current;
  const gameElementsAnim = useRef(new RNAnimated.Value(0)).current;
  const birdTransitionAnim = useRef(new RNAnimated.Value(1)).current;
  const gameEngineOpacity = useRef(new RNAnimated.Value(0)).current;
  const countdownToScoreAnim = useRef(new RNAnimated.Value(0)).current;
  const getReadyAnim = useRef(new RNAnimated.Value(0)).current;
  
  useEffect(() => {
    setEntities(setupWorld());
    loadBestScore();
    return () => {
      // Cleanup
    };
  }, []);
  
  // Load best score from AsyncStorage
  const loadBestScore = async () => {
    try {
      const storedBestScore = await AsyncStorage.getItem('sloppybirds_bestscore');
      if (storedBestScore !== null) {
        setBestScore(parseInt(storedBestScore, 10));
      }
    } catch (error) {
      console.error('Error loading best score:', error);
    }
  };
  
  // Save best score to AsyncStorage
  const saveBestScore = async (currentScore = score) => {
    try {
      if (currentScore > bestScore) {
        setBestScore(currentScore);
        await AsyncStorage.setItem('sloppybirds_bestscore', currentScore.toString());
      }
    } catch (error) {
      console.error('Error saving best score:', error);
    }
  };
  
  // Handle game events
  const onEvent = (e: any) => {
    if (e.type === 'game-over') {
      setRunning(false);
      setGameState('gameover');
      saveBestScore();
    } else if (e.type === 'score') {
      setScore(prevScore => prevScore + 1);
    } else if (e.type === 'power-up') {
      // Reset lives to 3 and enable invincibility
      setLives(3);
      setIsInvincible(true);
      
      // Update the player entity
      if (gameEngineRef.current) {
        const gameEngine = gameEngineRef.current as any;
        if (gameEngine.entities && gameEngine.entities.player) {
          gameEngine.entities.player.isInvincible = true;
        }
      }
    } else if (e.type === 'power-up-end') {
      // Disable invincibility
      setIsInvincible(false);
      
      // Update the player entity
      if (gameEngineRef.current) {
        const gameEngine = gameEngineRef.current as any;
        if (gameEngine.entities && gameEngine.entities.player) {
          gameEngine.entities.player.isInvincible = false;
        }
      }
    } else if (e.type === 'hit') {
      // Reduce lives by 1
      setLives(prevLives => prevLives - 1);
      
      // Play wobble animation
      if (gameEngineRef.current) {
        const gameEngine = gameEngineRef.current as any;
        if (gameEngine.entities && gameEngine.entities.player) {
          gameEngine.entities.player.isWobbling = true;
        }
      }
    }
  };

  // Start the countdown sequence
  const startCountdown = () => {
    // Set initial countdown value
    setCountdown(3);
    
    // Start the countdown animation
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startGameAfterCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Animate the countdown
    RNAnimated.sequence([
      RNAnimated.timing(countdownAnim, {
        toValue: 1.5,
        duration: 300,
        useNativeDriver: true,
      }),
      RNAnimated.timing(countdownAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Fade in "Get Ready!" text
    RNAnimated.timing(getReadyAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Reset game state for a new game
  const resetGame = () => {
    setScore(0);
    setLives(3);
    setIsInvincible(false);
    setGameState('countdown');
    setCountdown(3);
    setEntities(setupWorld());
    
    // Reset animations
    wobbleAnim.setValue(0);
    
    // Start countdown
    startCountdown();
  };

  // Start the game after countdown
  const startGameAfterCountdown = () => {
    setGameState('playing');
    setRunning(true);
    
    // Set gravity once game starts
    if (gameEngineRef.current) {
      const gameEngine = gameEngineRef.current as any;
      if (gameEngine.entities && gameEngine.entities.physics) {
        gameEngine.entities.physics.engine.gravity.y = GAME_CONSTANTS.GRAVITY_Y;
        
        // Make player dynamic so it can fall
        if (gameEngine.entities.player && gameEngine.entities.player.body) {
          Matter.Body.setStatic(gameEngine.entities.player.body, false);
          
          // Turn off countdown phase flag to enable collision detection
          gameEngine.entities.player.isInCountdownPhase = false;
        }
      }
    }
    
    // Animate countdown to score transition
    RNAnimated.timing(countdownToScoreAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Fade out "Get Ready!" text
    RNAnimated.timing(getReadyAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  // Setup the game world
  const setupWorld = () => {
    return setupWorldWithBird(
      selectedBird,
      gameState,
      birdPreviewPosition.current,
      wobbleAnim
    );
  };

  useEffect(() => {
    if (gameState === 'countdown' || gameState === 'playing') {
      // Only create new entities if we're transitioning to gameplay
      const newEntities = setupWorld();
      setEntities(newEntities);
      
      // If we're in the game engine ref, update it directly too
      if (gameEngineRef.current) {
        const gameEngine = gameEngineRef.current as any;
        if (gameEngine.swap) {
          gameEngine.swap(newEntities);
        }
      }
    } else if (gameState === 'menu') {
      // Reset animations when returning to menu
      menuFadeAnim.setValue(1);
      gameElementsAnim.setValue(0);
      birdTransitionAnim.setValue(1);
      gameEngineOpacity.setValue(0);
      
      // Setup world without player for menu state
      setEntities(setupWorld());
    }
  }, [gameState]);

  const handleTap = () => {
    if (gameState === 'playing' && entities && entities.physics && entities.player && entities.player.body) {
      // This resets vertical velocity regardless of current momentum, as per spec
      Matter.Body.setVelocity(entities.player.body, {
        x: 0,
        y: GAME_CONSTANTS.JUMP_VELOCITY
      });
      
      // Add a slight rotation for visual effect
      Matter.Body.setAngle(entities.player.body, -0.2);
    }
  };

  const selectNextBird = () => {
    const nextIndex = (currentBirdIndex + 1) % BIRD_CHARACTERS.length;
    setCurrentBirdIndex(nextIndex);
    setSelectedBird(BIRD_CHARACTERS[nextIndex]);
    
    // Update player color in entities if they exist
    if (entities?.player) {
      const updatedEntities = {...entities};
      updatedEntities.player.color = BIRD_CHARACTERS[nextIndex].color;
      setEntities(updatedEntities);
    }
  };

  const selectPreviousBird = () => {
    const prevIndex = (currentBirdIndex - 1 + BIRD_CHARACTERS.length) % BIRD_CHARACTERS.length;
    setCurrentBirdIndex(prevIndex);
    setSelectedBird(BIRD_CHARACTERS[prevIndex]);
    
    // Update player color in entities if they exist
    if (entities?.player) {
      const updatedEntities = {...entities};
      updatedEntities.player.color = BIRD_CHARACTERS[prevIndex].color;
      setEntities(updatedEntities);
    }
  };

  // Handle back button press
  const handleBackPress = () => {
    if (gameState === 'menu') {
      // On start screen: return to games menu
      router.push('/games');
    } else if (gameState === 'playing' || gameState === 'countdown') {
      // During gameplay: return to start screen
      resetGame();
      setGameState('menu');
    } else if (gameState === 'gameover') {
      // On game over screen: return to start screen
      setGameState('menu');
      setScore(0);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Background */}
      <Background gameState={gameState} />
      
      {entities && (
        <>
          {/* Game Engine - Always rendered but with controlled opacity */}
          <RNAnimated.View style={{ opacity: gameEngineOpacity, ...styles.gameEngineContainer }}>
            <GameEngine
              ref={gameEngineRef}
              systems={[GameLogicSystem, CreateObstacle, CreatePowerUp, MoveObjects, RemoveObjects, PowerUpSystem]}
              entities={entities}
              running={running}
              onEvent={onEvent}
              style={styles.gameEngine}
            />
          </RNAnimated.View>
          
          {/* Touch area for gameplay - IMPORTANT: positioned below the back button */}
          {gameState === 'playing' && (
            <TouchableWithoutFeedback onPress={handleTap}>
              <View style={[styles.touchArea, styles.touchAreaBelowBackButton]} />
            </TouchableWithoutFeedback>
          )}
          
          {/* Back Button - visible on all screens */}
          <View style={styles.backButtonWrapper}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBackPress}
              activeOpacity={0.7}
              testID="flappyBackButton"
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Unified Countdown and Score Display */}
          {(gameState === 'countdown' || gameState === 'playing') && (
            <View style={styles.gameplayUIContainer}>
              {/* Get Ready text - only visible during countdown */}
              {gameState === 'countdown' && (
                <RNAnimated.Text 
                  style={[
                    styles.getReadyText,
                    { opacity: getReadyAnim }
                  ]}
                >
                  Get Ready!
                </RNAnimated.Text>
              )}
              
              {/* Countdown that transitions to score */}
              <RNAnimated.View style={styles.countdownScoreContainer}>
                {gameState === 'countdown' && (
                  <RNAnimated.Text 
                    style={[
                      styles.countdownText,
                      {
                        transform: [{ scale: countdownAnim }],
                        opacity: RNAnimated.subtract(1, countdownToScoreAnim)
                      }
                    ]}
                  >
                    {countdown}
                  </RNAnimated.Text>
                )}
                
                {/* Score display that fades in as countdown fades out */}
                {(gameState === 'countdown' && countdown === 0) || gameState === 'playing' ? (
                  <RNAnimated.Text 
                    style={[
                      styles.scoreText,
                      isInvincible && styles.poweredUpText,
                      {
                        opacity: gameState === 'playing' ? 1 : countdownToScoreAnim
                      }
                    ]}
                  >
                    {score}
                  </RNAnimated.Text>
                ) : null}
              </RNAnimated.View>
              
              {/* Power-up indicator - only visible during gameplay */}
              {gameState === 'playing' && isInvincible && (
                <View style={styles.powerUpIndicator}>
                  <Text style={styles.powerUpText}>INVINCIBLE!</Text>
                </View>
              )}
            </View>
          )}
          
          {/* Lives Display (only during gameplay) */}
          {(gameState === 'playing' || gameState === 'countdown') && (
            <View style={styles.livesContainer}>
              {Array.from({ length: 3 }).map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.lifePoint,
                    index < lives ? styles.lifeActive : styles.lifeInactive
                  ]} 
                />
              ))}
            </View>
          )}
          
          {/* Game Over Screen */}
          {gameState === 'gameover' && (
            <View style={styles.gameOverContainer}>
              <Text style={styles.gameOverText}>Game Over</Text>
              <View style={styles.gameOverScoreContainer}>
                <Text style={styles.gameOverScoreText}>Score: {score}</Text>
                <Text style={styles.gameOverBestText}>Best: {bestScore}</Text>
              </View>
              <TouchableOpacity style={styles.playAgainButton} onPress={resetGame}>
                <Text style={styles.playAgainButtonText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Menu Screen */}
          {gameState === 'menu' && (
            <RNAnimated.View style={[styles.overlay, { opacity: menuFadeAnim }]}>
              <View style={[styles.menuContainer, styles.contentBelowBackButton]}>
                <Text style={styles.titleText}>Sloppy Birds</Text>
                
                <Text style={styles.chooseText}>Choose a vibe...</Text>
                
                <View style={styles.characterSelection}>
                  <TouchableOpacity onPress={selectPreviousBird} style={styles.arrowButton}>
                    <Text style={styles.arrowText}>←</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.birdContainer}>
                    <View 
                      ref={birdPreviewRef}
                      style={[styles.birdPreview, { backgroundColor: selectedBird.hasCustomImage ? 'transparent' : selectedBird.color }]}
                      onLayout={(event) => {
                        const { x, y, width, height } = event.nativeEvent.layout;
                        // Store the absolute position of the bird preview
                        birdPreviewPosition.current = {
                          x: x + width / 2,
                          y: y + height / 2
                        };
                      }}
                    >
                      {selectedBird.hasCustomImage ? (
                        <Image 
                          source={selectedBird.imageSource} 
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="contain"
                        />
                      ) : (
                        <>
                          <View style={styles.birdEye} />
                          <View style={styles.birdBeak} />
                        </>
                      )}
                    </View>
                    <Text style={styles.vibeText}>{selectedBird.name}</Text>
                  </View>
                  
                  <TouchableOpacity onPress={selectNextBird} style={styles.arrowButton}>
                    <Text style={styles.arrowText}>→</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.selectionDots}>
                  {BIRD_CHARACTERS.map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.selectionDot, 
                        index === currentBirdIndex && styles.selectedDot
                      ]} 
                    />
                  ))}
                </View>
                
                <TouchableOpacity style={styles.startButton} onPress={() => resetGame()}>
                  <Text style={styles.startButtonText}>Let's Fly!</Text>
                </TouchableOpacity>
                
                <View style={styles.scoreBoard}>
                  <View style={styles.scoreBoardColumn}>
                    <Text style={styles.scoreBoardHeader}>Best</Text>
                    <Text style={styles.scoreBoardScore}>{bestScore}</Text>
                  </View>
                  <View style={styles.scoreBoardDivider} />
                  <View style={styles.scoreBoardColumn}>
                    <Text style={styles.scoreBoardHeader}>Leaderboard</Text>
                    <View style={styles.leaderboardEntries}>
                      <Text style={styles.leaderboardEntry}>—</Text>
                      <Text style={styles.leaderboardEntry}>—</Text>
                      <Text style={styles.leaderboardEntry}>—</Text>
                    </View>
                  </View>
                </View>
              </View>
            </RNAnimated.View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  gameEngineContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5, // Higher than background, lower than UI elements
  },
  gameEngine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  gameContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  touchArea: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  touchAreaBelowBackButton: {
    top: 80, // Start below back button area
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10, // Higher than game engine
  },
  backButtonWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingTop: 20,
    paddingHorizontal: 20,
    zIndex: 999, // Extremely high z-index to ensure it's above everything
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Semi-transparent background
    borderBottomWidth: 0, // Remove any border that might cause color differences
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    elevation: 5, // For Android
  },
  backButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  contentBelowBackButton: {
    paddingTop: 80, // Ensure content starts below back button
  },
  menuContainer: {
    width: '80%',
    alignItems: 'center',
    backgroundColor: 'transparent', 
    borderRadius: 20,
    padding: 20,
    // Removing the white border
    // borderWidth: 2,
    // borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  titleText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    fontFamily: 'System',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  chooseText: {
    fontSize: 22,
    fontStyle: 'italic',
    color: '#fff',
    marginBottom: 15,
    fontFamily: 'System',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  characterSelection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  arrowButton: {
    padding: 10,
  },
  arrowText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: 'bold',
  },
  birdContainer: {
    alignItems: 'center',
    marginBottom: 5, // Reduced margin to bring dots closer to bird
  },
  birdPreview: {
    width: 112.5,
    height: 112.5,
    borderRadius: 56.25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5, // Reduced margin to bring dots closer
  },
  vibeText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    fontStyle: 'italic',
    marginBottom: 5,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  birdEye: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: 'white',
    position: 'absolute',
    top: 25,
    left: 25,
  },
  birdBeak: {
    width: 20,
    height: 10,
    backgroundColor: 'orange',
    position: 'absolute',
    right: 15,
    top: 35,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  swipeHint: {
    maxWidth: 180,
    marginTop: 5,
  },
  swipeText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  selectionDots: {
    flexDirection: 'row',
    marginBottom: 25, // Increased margin to create more space before button
  },
  selectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#555',
    marginHorizontal: 5,
  },
  selectedDot: {
    backgroundColor: '#fff',
  },
  optionsText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  startButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 35, // Increased margin to create more space after button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scoreBoard: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  scoreBoardColumn: {
    flex: 1,
    alignItems: 'center',
  },
  scoreBoardDivider: {
    width: 1,
    backgroundColor: '#fff',
    height: '100%',
    marginHorizontal: 10,
  },
  scoreBoardHeader: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  scoreBoardScore: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  leaderboardEntries: {
    alignItems: 'center',
  },
  leaderboardEntry: {
    color: '#fff',
    fontSize: 20,
    marginVertical: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  gameplayUIContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    pointerEvents: 'none', // Allow touch events to pass through
  },
  countdownScoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  getReadyText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  countdownText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 10,
  },
  scoreText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    position: 'absolute',
  },
  bestScoreText: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 30,
  },
  poweredUpText: {
    color: '#f39c12',
    textShadowColor: 'rgba(243, 156, 18, 0.5)',
  },
  powerUpIndicator: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: 'rgba(243, 156, 18, 0.7)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#f39c12',
  },
  powerUpText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    paddingTop: 80, // Below back button
  },
  gameOverText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 10,
  },
  gameOverScoreContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  gameOverScoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  gameOverBestText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  playAgainButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  livesContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    zIndex: 100,
  },
  lifePoint: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#fff',
  },
  lifeActive: {
    backgroundColor: '#e74c3c',
  },
  lifeInactive: {
    backgroundColor: 'rgba(231, 76, 60, 0.3)',
  },
});

export default SloppyBirds;
