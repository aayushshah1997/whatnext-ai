import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, Dimensions, TextInput, ActivityIndicator, KeyboardAvoidingView, ScrollView, Platform, Animated, TouchableWithoutFeedback, Keyboard, Image, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { CircleHelp as HelpCircle, Wine, Beer, Utensils, Gamepad2, Send, X } from 'lucide-react-native';
import ScreenLayout from '../../components/ScreenLayout';
import { generateDrinkRecommendation } from '../../src/utils/mosesAI';
import { MosesContext, DrinkRecommendation, FeedbackType } from '../../src/types/moses';
import { Asset } from 'expo-asset';

const CIRCLE_SIZE = Dimensions.get('window').width * 0.9;
const OUTER_CIRCLE_SIZE = CIRCLE_SIZE;
const INNER_CIRCLE_SIZE = CIRCLE_SIZE * 0.5;
const TILE_SIZE = CIRCLE_SIZE * 0.25;
const CENTER_TILE_SIZE = CIRCLE_SIZE * 0.35;

// Define tile positions in degrees (evenly spaced diagonally)
const tiles = [
  { name: 'drinks' as const, icon: Wine, route: '/drinks', angle: -45 },
  { name: 'bars' as const, icon: Beer, route: '/bars', angle: 45 },
  { name: 'food' as const, icon: Utensils, route: '/food', angle: 135 },
  { name: 'games' as const, icon: Gamepad2, route: '/games', angle: -135 },
];

export default function HomeScreen() {
  const router = useRouter();
  const [showMosesModal, setShowMosesModal] = useState(false);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [logoLoaded, setLogoLoaded] = useState(false);
  
  // Track which tile is being pressed
  const [pressedTile, setPressedTile] = useState<string | null>(null);
  
  // Create pulsating animation for the inner circle
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;

  // Preload the logo image when component mounts
  useEffect(() => {
    const preloadImages = async () => {
      try {
        await Asset.loadAsync(require('../../src/assets/logo.png'));
        setLogoLoaded(true);
      } catch (error) {
        console.error('Failed to preload logo:', error);
        // Set loaded anyway to avoid infinite loading state
        setLogoLoaded(true);
      }
    };
    
    preloadImages();
  }, []);

  // Start the pulsating animation when component mounts
  useEffect(() => {
    // Pulse animation for size
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
    
    // Glow animation for opacity
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.5,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    ).start();
  }, []);

  const handleTilePress = (route: string, tileName: string) => {
    // Set the pressed tile to create animation effect
    setPressedTile(tileName);
    
    // Add a small delay before navigation to show the animation
    setTimeout(() => {
      // Reset the pressed state
      setPressedTile(null);
      // Navigate to the route
      router.push(route);
    }, 150);
  };

  const handleMosesPress = () => {
    setShowMosesModal(true);
    // Reset state when opening modal
    setQuestion('');
    setResponse('');
  };

  const handleSubmit = async () => {
    if (!question.trim()) return;
    
    const currentQuestion = question;
    setIsLoading(true);
    // Clear input field immediately after submitting
    setQuestion('');
    setCurrentQuestion(currentQuestion);
    
    try {
      console.log('Moses AI: sending question', currentQuestion);
      
      // Create a custom prompt for the Moses chatbot
      const mosesPrompt: Partial<MosesContext> = {
        systemPrompt: `You are Moses, an AI bartender and party assistant with a witty, slightly sarcastic personality.
        You have expertise in:
        - Cocktails and drink recommendations
        - Bar recommendations
        - Food pairings
        - Party games and entertainment
        
        Your tone should be:
        - Friendly and conversational
        - Slightly sassy but never rude
        - Balance banter with helpful information - don't just joke around
        - If the user seems serious or upset, tone down the banter and be more supportive
        
        Remember: You're not just any AI - you're Moses, the life of the party and the user's go-to friend for all things fun!`,
        question: currentQuestion
      };
      
      const response = await generateDrinkRecommendation(mosesPrompt);
      console.log('Moses AI: response', response);
      
      // Extract the text content from the API response
      let textResponse = 'Sorry, I could not generate a response.';
      if (response && response.choices && response.choices.length > 0 && response.choices[0].message) {
        textResponse = response.choices[0].message.content || textResponse;
        
        // Check if response looks like JSON and clean it up
        if (textResponse.trim().startsWith('{') || textResponse.trim().startsWith('[')) {
          try {
            const jsonResponse = JSON.parse(textResponse);
            // Convert JSON to a conversational response
            textResponse = "I should be responding conversationally! Let me try again. How can I help you with drinks, food, bars, or party games today?";
          } catch (e) {
            // Not valid JSON, continue with the response as is
          }
        }
      }
      
      setResponse(textResponse);
    } catch (error) {
      console.error('Error:', error);
      setResponse('Sorry, there was an error processing your question. How about we talk about drinks or party games instead?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenLayout hideBackButton={true}>
      <View style={styles.container}>
        <View style={styles.circleContainer}>
          {/* Outer circle background */}
          <View style={[styles.circleBackground, { width: OUTER_CIRCLE_SIZE, height: OUTER_CIRCLE_SIZE }]} />
          
          {/* Inner circle background */}
          <Animated.View style={[
            styles.innerCircleBackground, 
            { 
              width: INNER_CIRCLE_SIZE, 
              height: INNER_CIRCLE_SIZE, 
              transform: [{ scale: pulseAnim }], 
              opacity: glowOpacity 
            }
          ]} />
          
          {/* Tiles */}
          {tiles.map((tile) => {
            // Calculate position based on angle
            const angleInRadians = (tile.angle * Math.PI) / 180;
            const radius = OUTER_CIRCLE_SIZE / 2 - TILE_SIZE / 2;
            const left = radius * Math.cos(angleInRadians);
            const top = radius * Math.sin(angleInRadians);
            
            return (
              <TouchableOpacity
                key={tile.name}
                style={[
                  styles.tileWrapper,
                  {
                    transform: [
                      { translateX: left },
                      { translateY: top },
                    ],
                  },
                ]}
                onPress={() => handleTilePress(tile.route, tile.name)}
              >
                <View
                  style={[
                    styles.tile,
                    pressedTile === tile.name && styles.pressedTile,
                  ]}
                >
                  <tile.icon size={24} color="#fff" />
                  <Text style={styles.tileText}>{tile.name}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
          
          {/* Center tile - Moses AI */}
          <TouchableOpacity
            style={styles.centerTile}
            onPress={handleMosesPress}
            activeOpacity={0.8}
          >
            <Animated.View
              style={[
                styles.centerTileContent,
                {
                  transform: [{ scale: pulseAnim }],
                  shadowOpacity: glowOpacity,
                },
              ]}
            >
              {!logoLoaded ? (
                <View style={styles.logoPlaceholder}>
                  <ActivityIndicator size="large" color="#FFD700" />
                </View>
              ) : (
                <Image
                  source={require('../../src/assets/logo.png')}
                  style={[styles.centerLogo, { marginTop: 10 }]}
                  fadeDuration={0}
                />
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
        
        {/* Moses AI Modal */}
        <Modal
          visible={showMosesModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowMosesModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Ask Moses AI</Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setShowMosesModal(false)}
                    >
                      <X size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.modalContent}>
                    {/* Moses AI Avatar */}
                    {!response && (
                      <View style={styles.mosesAvatarContainer}>
                        <View style={styles.mosesAvatar}>
                          <Image source={require('../../src/assets/logo.png')} style={styles.avatarImage} />
                        </View>
                        <Text style={styles.mosesWelcomeText}>
                          Hey there! I'm Moses, your AI bartender. Ask me anything about drinks, bars, or nightlife!
                        </Text>
                      </View>
                    )}
                    
                    {/* Response */}
                    {response && (
                      <View style={styles.chatContainer}>
                        {/* User's question */}
                        <View style={styles.userMessageContainer}>
                          <View style={styles.userMessage}>
                            <Text style={styles.userMessageText}>{currentQuestion}</Text>
                          </View>
                          <View style={styles.userAvatar}>
                            <Text style={styles.userAvatarText}>You</Text>
                          </View>
                        </View>
                        
                        {/* Moses response */}
                        <View style={styles.mosesMessageContainer}>
                          <View style={styles.mosesAvatar}>
                            <Image source={require('../../src/assets/logo.png')} style={styles.avatarImage} />
                          </View>
                          <View style={styles.mosesMessage}>
                            <Text style={styles.responseText}>{response}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </ScrollView>
                  
                  <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.input}
                        placeholder="Ask Moses anything..."
                        placeholderTextColor="#999"
                        value={question}
                        onChangeText={setQuestion}
                        multiline
                      />
                      <TouchableOpacity
                        style={styles.sendButton}
                        onPress={handleSubmit}
                        disabled={isLoading || !question.trim()}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Send size={24} color="#fff" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    width: OUTER_CIRCLE_SIZE,
    height: OUTER_CIRCLE_SIZE,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBackground: {
    position: 'absolute',
    borderRadius: OUTER_CIRCLE_SIZE / 2,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: 'rgba(44, 62, 80, 0.1)',
  },
  innerCircleBackground: {
    position: 'absolute',
    borderRadius: INNER_CIRCLE_SIZE / 2,
    backgroundColor: '#2C3E50',
  },
  tileWrapper: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tile: {
    backgroundColor: '#2C3E50',
    borderRadius: TILE_SIZE / 2,
    width: TILE_SIZE,
    height: TILE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 5,
  },
  tileText: {
    color: '#fff',
    marginTop: 4,
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  centerTile: {
    position: 'absolute',
    width: CENTER_TILE_SIZE,
    height: CENTER_TILE_SIZE,
    zIndex: 1,
  },
  centerTileContent: {
    backgroundColor: '#000000',
    borderRadius: CENTER_TILE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    padding: 8,
  },
  centerLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 0,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mosesText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  askMosesText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  mosesAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  mosesAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  mosesAvatarText: {
    color: '#fff',
    fontSize: 24,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  mosesWelcomeText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    flexWrap: 'wrap',
  },
  chatContainer: {
    marginBottom: 20,
  },
  mosesMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  mosesMessage: {
    backgroundColor: '#2C3E50',
    borderRadius: 18,
    padding: 15,
    marginLeft: 10,
    maxWidth: '80%',
  },
  responseText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  userMessage: {
    backgroundColor: '#3498db',
    borderRadius: 18,
    padding: 15,
    marginRight: 10,
    maxWidth: '80%',
  },
  userMessageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#333',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    minHeight: 40,
    maxHeight: 120,
    paddingRight: 50,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#3498db',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 10,
    bottom: 8,
  },
  pressedTile: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
});