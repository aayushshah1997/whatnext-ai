import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator, Animated, Easing, Modal, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { generateDrinkRecommendation } from '../../src/utils/mosesAI';
import { DrinkRecommendation, MosesContext, AlternativeType, NewAlternative, LegacyAlternative } from '../../src/types/moses';
import { X } from 'lucide-react-native';
import ScreenLayout from '../../components/ScreenLayout';
import InputBar from '../../src/components/InputBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Type for quiz questions
type QuestionKey = 'lastDrink' | 'alcoholPreference' | 'drinksConsumed' | 'mood' | 'flavorProfile' | 'socialContext';

const questions = [
  {
    question: 'What was your last drink?',
    options: ['Beer', 'Wine', 'Cocktail', 'Shots', 'Other']
  },
  {
    question: 'What type of alcohol do you prefer?',
    options: ['Beer', 'Wine', 'Whiskey', 'Vodka', 'Tequila', 'Rum', 'Gin']
  },
  {
    question: 'How many drinks have you had today?',
    options: ['0', '1', '2', '3', '4+']
  },
  {
    question: 'How are you feeling?',
    options: [
      'Feeling great — let\'s keep the night going',
      'I need to pace myself a bit',
      'Feeling adventurous — surprise me',
      'I might be a little too far gone',
      'Other',
    ],
  },
  {
    question: 'What\'s your flavor profile?',
    options: ['Neat & Smooth', 'Sweet & Fruity', 'Citrusy', 'Bitter', 'Spicy', 'Other']
  },
  {
    question: 'What\'s your social context?',
    options: ['Alone', 'Date Night', 'With Friends', 'Party', 'Dinner', 'Other']
  }
] as const;

type Answers = {
  [K in QuestionKey]: string;
};

const getWelcomeMessage = (answers: Answers) => {
  const prevDrinks = parseInt(answers.drinksConsumed) || 0;
  const timeOfDay = new Date().getHours();
  const messages = [
    { text: "Ready to discover your perfect drink? 🍸", condition: () => true },
    { text: "Back for another round? Let's make it count! ✨", condition: () => prevDrinks > 0 },
    { text: "Time for a nightcap? Let's find something special! 🌙", condition: () => timeOfDay >= 22 || timeOfDay < 4 },
    { text: "Happy hour inspiration coming right up! 🎉", condition: () => timeOfDay >= 16 && timeOfDay < 19 },
    { text: "Brunch drinks? Say no more! 🥂", condition: () => timeOfDay >= 10 && timeOfDay < 14 },
  ];

  return messages.find(m => m.condition())?.text || messages[0].text;
};

const getHydrationMessage = () => {
  const messages = [
    "Remember to stay hydrated between drinks!",
    "Water is your friend - have a glass between drinks.",
    "Stay hydrated, friend! Your future self will thank you.",
    "Pro tip: alternate between drinks and water for a better tomorrow.",
    "Hydration is key to a great night!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};

const formatHydrationTip = (tip: string | undefined) => {
  if (!tip) return '';
  return tip.replace(/["{}]/g, '').trim();
};

const getLoadingMessage = () => {
  const messages = [
    "Moses is mixing your perfect drink... 🍸",
    "Your drink is being crafted... 🎨",
    "Just a moment, your drink is on its way... 🕰️",
    "Moses is working his magic... ✨",
    "Your drink is almost ready... 🍹",
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

// Helper function to extract clean JSON from AI response
const extractCleanJson = (content: string): string => {
  console.log('Extracting clean JSON from content:', content);
  
  // Try to find JSON content between backticks or code blocks
  const codeBlockMatch = content.match(/```(?:json)?([\s\S]*?)```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    console.log('Found JSON in code block');
    return codeBlockMatch[1].trim();
  }
  
  // Try to find JSON content between curly braces
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    console.log('Found JSON between curly braces');
    return jsonMatch[0];
  }
  
  // If all else fails, return the original content
  console.log('No JSON pattern found, returning original content');
  return content;
};

// Helper function to parse the AI response
const parseAIResponse = (content: string): DrinkRecommendation | null => {
  if (!content) {
    console.log('Empty content, cannot parse');
    return null;
  }
  
  console.log('Parsing AI response:', content);
  
  try {
    // First, try to extract clean JSON
    const cleanJson = extractCleanJson(content);
    console.log('Clean JSON:', cleanJson);
    
    // Try to parse the JSON
    let parsedData;
    try {
      parsedData = JSON.parse(cleanJson);
      console.log('Successfully parsed JSON:', parsedData);
    } catch (jsonError) {
      console.log('Failed to parse as JSON, trying to parse as key-value pairs');
      
      // If JSON parsing fails, try to parse as key-value pairs
      const result: Record<string, any> = {};
      
      // Match for mainSuggestion:drink:value,description:value pattern
      const mainSuggestionMatch = content.match(/mainSuggestion:drink:([^,]+),description:([^,]+)/);
      if (mainSuggestionMatch) {
        result.mainSuggestion = {
          drink: mainSuggestionMatch[1].trim(),
          description: mainSuggestionMatch[2].trim()
        };
      }
      
      // Match for safetyTip:value pattern
      const safetyTipMatch = content.match(/safetyTip:([^,]+)/);
      if (safetyTipMatch) {
        result.safetyTip = safetyTipMatch[1].trim();
      }
      
      // Match for recipeLink:value pattern
      const recipeLinkMatch = content.match(/recipeLink:([^,]+)/);
      if (recipeLinkMatch) {
        result.recipeLink = recipeLinkMatch[1].trim();
      }
      
      // If we found any data, use it
      if (Object.keys(result).length > 0) {
        console.log('Parsed as key-value pairs:', result);
        parsedData = result;
      } else {
        // If all parsing fails, create a fallback response
        console.log('All parsing failed, using fallback');
        return {
          mainSuggestion: {
            drink: "Hydration Break",
            description: "I need a moment. Grab a sip of water while I rethink your drink!"
          },
          safetyTip: "Hydration is key to a great night out. Remember to drink water between alcoholic beverages.",
          alternatives: [{
            feeling: "While you wait...",
            suggestions: [
              { drink: "Water with lemon", description: "A refreshing non-alcoholic option" },
              { drink: "Sparkling water", description: "Bubbly and fun without the alcohol" }
            ]
          }]
        };
      }
    }
    
    // Validate and structure the parsed data
    const validatedResponse: DrinkRecommendation = {};
    
    // Process mainSuggestion
    if (parsedData.mainSuggestion) {
      validatedResponse.mainSuggestion = {
        drink: parsedData.mainSuggestion.drink || "Drink Recommendation",
        description: parsedData.mainSuggestion.description || "No description available"
      };
      
      // For backward compatibility
      validatedResponse.mainDrink = {
        name: parsedData.mainSuggestion.drink || "Drink Recommendation",
        description: parsedData.mainSuggestion.description || "No description available",
        recipeUrl: parsedData.recipeLink
      };
    } else if (parsedData.mainDrink) {
      validatedResponse.mainSuggestion = {
        drink: parsedData.mainDrink.name || "Drink Recommendation",
        description: parsedData.mainDrink.description || "No description available"
      };
      validatedResponse.mainDrink = parsedData.mainDrink;
    } else {
      validatedResponse.mainSuggestion = {
        drink: "Hydration Break",
        description: "I need a moment. Grab a sip of water while I rethink your drink!"
      };
      validatedResponse.mainDrink = {
        name: "Hydration Break",
        description: "I need a moment. Grab a sip of water while I rethink your drink!"
      };
    }
    
    // Process safety tip
    validatedResponse.safetyTip = parsedData.safetyTip || parsedData.hydrationTip || 
      "Hydration is key to a great night out. Remember to drink water between alcoholic beverages.";
    validatedResponse.hydrationTip = validatedResponse.safetyTip;
    
    // Process recipe link
    validatedResponse.recipeLink = parsedData.recipeLink || 
      (parsedData.mainDrink && parsedData.mainDrink.recipeUrl) || null;
    
    // Process alternatives
    if (parsedData.alternatives && Array.isArray(parsedData.alternatives)) {
      if (parsedData.alternatives.length > 0) {
        if ('feeling' in parsedData.alternatives[0]) {
          // New format
          validatedResponse.alternatives = parsedData.alternatives as any;
        } else if ('name' in parsedData.alternatives[0]) {
          // Legacy format - convert to new format
          validatedResponse.alternatives = parsedData.alternatives.map((alt: any) => ({
            feeling: "Alternative option",
            suggestions: [{
              drink: alt.name,
              description: alt.description
            }]
          })) as any;
        }
      }
    } else {
      // Default alternatives if none provided
      validatedResponse.alternatives = [{
        feeling: "You might also enjoy",
        suggestions: [
          { drink: "Water with lemon", description: "A refreshing non-alcoholic option" },
          { drink: "Sparkling water", description: "Bubbly and fun without the alcohol" }
        ]
      }] as any;
    }
    
    console.log('Validated response:', validatedResponse);
    return validatedResponse;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return null;
  }
};

export default function DrinksScreen() {
  const [showQuiz, setShowQuiz] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    lastDrink: '',
    alcoholPreference: '',
    drinksConsumed: '',
    mood: '',
    flavorProfile: '',
    socialContext: '',
  });
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<DrinkRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTweakSheet, setShowTweakSheet] = useState(false);
  const [tweakInput, setTweakInput] = useState('');
  const [previousFeedback, setPreviousFeedback] = useState<{ type: 'positive' | 'negative' | 'alternative' | 'tweak'; tweakRequest?: string } | undefined>();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const cardAnimations = useRef<Animated.Value[]>([]).current;
  const quizStartTime = useRef(Date.now());
  const insets = useSafeAreaInsets();

  const handleAnswer = async (answer: string) => {
    const questionKey = ['lastDrink', 'alcoholPreference', 'drinksConsumed', 'mood', 'flavorProfile', 'socialContext'][currentQuestion] as QuestionKey;
    const newAnswers = { ...answers, [questionKey]: answer };
    setAnswers(newAnswers);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setLoading(true);
      setShowQuiz(false);
      setError(null);
      try {
        const avgResponseTime = (Date.now() - quizStartTime.current) / (questions.length * 1000);
        const context: MosesContext = {
          alcoholType: newAnswers.alcoholPreference,
          drinksConsumed: newAnswers.drinksConsumed,
          feeling: newAnswers.mood,
          flavorProfile: newAnswers.flavorProfile,
          currentMood: newAnswers.socialContext,
          responseTime: avgResponseTime,
          previousFeedback,
        };

        console.log('Calling AI with context:', context);
        const result = await generateDrinkRecommendation(context);
        console.log('🧪 Raw API result:', JSON.stringify(result));
        
        // Process the API response to extract the drink recommendation
        const processedResult = parseAIResponse(result.choices[0].message.content);
        
        setRecommendation(processedResult);
        setLoading(false);
        setShowRecommendation(true);
      } catch (err) {
        console.error('Error getting drink recommendation:', err);
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Failed to get recommendation');
        
        // Check if this is a rate limit error
        const errorMessage = err instanceof Error ? err.message : '';
        if (errorMessage.includes('rate limit') || errorMessage.includes('model_rate_limit')) {
          Alert.alert(
            'Rate Limit Reached',
            'The AI service is currently at capacity. Please try again in a few moments.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Error',
            'Unable to get a drink recommendation. Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFeedback = async (type: 'positive' | 'negative' | 'alternative' | 'tweak') => {
    if (type === 'tweak') {
      setShowTweakSheet(true);
      return;
    }

    setPreviousFeedback({ type });
    if (type === 'positive') {
      Alert.alert(
        'Perfect Choice!', 
        'Moses is thrilled you enjoyed this recommendation! Your feedback helps Moses learn your taste preferences.'
      );
    } else if (type === 'alternative') {
      // Get a new recommendation with the same parameters
      setLoading(true);
      try {
        const avgResponseTime = (Date.now() - quizStartTime.current) / (questions.length * 1000);
        const context: MosesContext = {
          alcoholType: answers.alcoholPreference,
          drinksConsumed: answers.drinksConsumed,
          feeling: answers.mood,
          flavorProfile: answers.flavorProfile,
          currentMood: answers.socialContext,
          responseTime: avgResponseTime,
          previousFeedback: { type: 'alternative' },
        };

        console.log('Calling AI for an alternative recommendation:', context);
        const alternativePrompt: Partial<MosesContext> = {
          systemPrompt: `You are Moses, a witty bartender AI. Generate ONE alternative drink recommendation based on the user's preferences.
          Be creative, fun, and personalized.
          Format your response as a conversational message, not JSON.
          Include the drink name, a brief description, and why it might be a good fit.
          Keep it under 150 words and make it sound natural.`,
          question: "Give me an alternative drink recommendation",
          alcoholType: answers.alcoholPreference,
          drinksConsumed: answers.drinksConsumed,
          feeling: answers.mood,
          flavorProfile: answers.flavorProfile,
          currentMood: answers.socialContext,
          previousFeedback: { type: 'alternative' }
        };
        
        console.log('Calling AI for an alternative recommendation:', alternativePrompt);
        const result = await generateDrinkRecommendation(alternativePrompt);
        console.log('AI result for alternative recommendation:', result);
        
        // Process the API response
        const processedResult = parseAIResponse(result.choices[0].message.content);
        
        setRecommendation(processedResult);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get recommendation');
        Alert.alert(
          'Error',
          'Unable to get an alternative drink recommendation. Please check your internet connection and try again.',
        );
      } finally {
        setLoading(false);
      }
    } else {
      // Get a new recommendation with negative feedback
      setLoading(true);
      try {
        const avgResponseTime = (Date.now() - quizStartTime.current) / (questions.length * 1000);
        const context: MosesContext = {
          alcoholType: answers.alcoholPreference,
          drinksConsumed: answers.drinksConsumed,
          feeling: answers.mood,
          flavorProfile: answers.flavorProfile,
          currentMood: answers.socialContext,
          responseTime: avgResponseTime,
          previousFeedback: { type: 'negative' },
        };

        console.log('Calling AI with new context after negative feedback:', context);
        const result = await generateDrinkRecommendation(context);
        console.log('AI result after negative feedback:', result);
        
        // Process the API response
        const processedResult = parseAIResponse(result.choices[0].message.content);
        
        setRecommendation(processedResult);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get recommendation');
        Alert.alert(
          'Error',
          'Unable to get a new drink recommendation. Please check your internet connection and try again.',
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTweakSubmit = (value: string) => {
    setPreviousFeedback({ type: 'tweak', tweakRequest: value });
    setShowTweakSheet(false);
    setTweakInput('');
    // Get a new recommendation with tweak feedback
    setLoading(true);
    (async () => {
      try {
        const avgResponseTime = (Date.now() - quizStartTime.current) / (questions.length * 1000);
        const context: MosesContext = {
          alcoholType: answers.alcoholPreference,
          drinksConsumed: answers.drinksConsumed,
          feeling: answers.mood,
          flavorProfile: answers.flavorProfile,
          currentMood: answers.socialContext,
          responseTime: avgResponseTime,
          previousFeedback: { type: 'tweak', tweakRequest: value },
        };
        const result = await generateDrinkRecommendation(context);
        const processedResult = parseAIResponse(result.choices[0].message.content);
        setRecommendation(processedResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get recommendation');
        Alert.alert('Error', 'Unable to get a tweaked drink recommendation. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleTweakSend = () => {
    if (!tweakInput.trim()) return;
    handleTweakSubmit(tweakInput.trim());
    setShowTweakSheet(false);
    setTweakInput('');
  };

  const handleOtherSubmit = (value: string) => {
    handleAnswer(value);
  };

  // Function to reset the quiz and start over
  const resetQuiz = () => {
    setShowRecommendation(false);
    setShowQuiz(true);
    setCurrentQuestion(0);
    quizStartTime.current = Date.now();
    setAnswers({
      lastDrink: '',
      alcoholPreference: '',
      drinksConsumed: '',
      mood: '',
      flavorProfile: '',
      socialContext: '',
    });
  };

  React.useEffect(() => {
    if (showQuiz) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showQuiz]);

  return (
    <ScreenLayout>
      <SafeAreaView style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={showTweakSheet ? { paddingBottom: 100 } : undefined}
          keyboardShouldPersistTaps="handled"
        >
          {!showQuiz && !showRecommendation && (
            <View style={styles.welcomeBannerContainer}>
              <Text style={styles.welcomeBannerText}>{getWelcomeMessage(answers)}</Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => {
                  setShowQuiz(true);
                  quizStartTime.current = Date.now();
                }}
              >
                <Text style={styles.startButtonText}>Start Quiz</Text>
              </TouchableOpacity>
            </View>
          )}

          {showQuiz && (
            <View style={styles.quizContainer}>
              <Text style={styles.questionText}>
                {questions[currentQuestion].question}
              </Text>
              <View style={styles.optionsContainer}>
                {questions[currentQuestion].options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.optionButton}
                    onPress={() => {
                      if (option === 'Other') {
                        handleOtherSubmit(option);
                      } else {
                        handleAnswer(option);
                      }
                    }}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {loading && (
            <Animated.View 
              style={styles.loadingContainer}
              onLayout={() => {
                // Fade in animation
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 500,
                  useNativeDriver: true,
                  easing: Easing.out(Easing.cubic)
                }).start();
              }}
            >
              <ActivityIndicator size="large" color="#9C27B0" />
              <Text style={styles.loadingText}>Crafting the perfect drink for you...</Text>
            </Animated.View>
          )}

          {showRecommendation && recommendation ? (
            <Animated.View 
              style={[styles.recommendationContainer, { opacity: fadeAnim }]}
              onLayout={() => {
                // Fade in animation
                Animated.timing(fadeAnim, {
                  toValue: 1,
                  duration: 500,
                  useNativeDriver: true,
                  easing: Easing.out(Easing.cubic)
                }).start();
              }}
            >
              {/* Vibe Summary */}
              {recommendation.vibeSummary && (
                <Animated.View style={styles.vibeSummaryContainer}>
                  <Text style={styles.emojiText}>{recommendation.vibeSummary.emoji}</Text>
                  <Text style={styles.vibeSummaryMessage}>{recommendation.vibeSummary.message}</Text>
                </Animated.View>
              )}
              
              {/* Main Suggestion */}
              {recommendation.mainSuggestion ? (
                <Animated.View style={styles.mainSuggestionCard}>
                  <Text style={styles.sectionTitle}>
                    {recommendation.mainSuggestion.drink}
                  </Text>
                  
                  <Text style={styles.drinkDescription}>
                    {recommendation.mainSuggestion.description}
                  </Text>
                  
                  {/* Recipe Link */}
                  {recommendation.recipeLink && (
                    <TouchableOpacity style={styles.recipeLinkButton}>
                      <Link href={recommendation.recipeLink}>
                        <Text style={styles.recipeLinkText}>📖 View Recipe</Text>
                      </Link>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              ) : recommendation.mainDrink ? (
                <Animated.View style={styles.mainSuggestionCard}>
                  <Text style={styles.sectionTitle}>
                    {recommendation.mainDrink.name}
                  </Text>
                  
                  <Text style={styles.drinkDescription}>
                    {recommendation.mainDrink.description || "⚠️ No response received from What Next AI. Please try again."}
                  </Text>
                  
                  {/* Recipe Link */}
                  {recommendation.mainDrink.recipeUrl && (
                    <TouchableOpacity style={styles.recipeLinkButton}>
                      <Link href={recommendation.mainDrink.recipeUrl}>
                        <Text style={styles.recipeLinkText}>📖 View Recipe</Text>
                      </Link>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              ) : (
                <Animated.View style={styles.mainSuggestionCard}>
                  <Text style={styles.sectionTitle}>No Recommendation</Text>
                  <Text style={styles.drinkDescription}>
                    🧠 I need a moment. Grab a sip of water while I rethink your drink!
                  </Text>
                </Animated.View>
              )}
              
              {/* Safety Tip */}
              {(recommendation.safetyTip || recommendation.hydrationTip) && (
                <Animated.View style={styles.safetyTipContainer}>
                  <Text style={styles.safetyTipText}>
                    💧 {recommendation.safetyTip || recommendation.hydrationTip}
                  </Text>
                </Animated.View>
              )}
              
              {/* Alternative Options */}
              {recommendation.alternatives && recommendation.alternatives.length > 0 && (
                <View style={styles.alternativesContainer}>
                  <Text style={styles.alternativesTitle}>Alternative Options</Text>
                  
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.alternativesScrollContent}
                  >
                    {recommendation.alternatives.map((alternative: AlternativeType, index: number) => (
                      <View key={index} style={styles.alternativeHorizontalCard}>
                        {alternative && 'feeling' in alternative ? (
                          <>
                            <Text style={styles.alternativeFeeling}>{alternative.feeling}</Text>
                            {alternative.suggestions && alternative.suggestions.map((suggestion, suggestionIdx: number) => (
                              <View key={suggestionIdx} style={styles.suggestionItem}>
                                <Text style={styles.suggestionName}>{suggestion.drink}</Text>
                                <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                                {suggestion.recipeLink && (
                                  <TouchableOpacity style={styles.alternativeRecipeLink}>
                                    <Link href={suggestion.recipeLink || '#'}>
                                      <Text style={styles.alternativeRecipeLinkText}>View Recipe</Text>
                                    </Link>
                                  </TouchableOpacity>
                                )}
                              </View>
                            ))}
                          </>
                        ) : (
                          <>
                            <Text style={styles.alternativeName}>{(alternative as LegacyAlternative).name}</Text>
                            <Text style={styles.alternativeDescription}>{(alternative as LegacyAlternative).description}</Text>
                            {(alternative as LegacyAlternative).recipeUrl && (
                              <TouchableOpacity style={styles.alternativeRecipeLink}>
                                <Link href={(alternative as LegacyAlternative).recipeUrl || '#'}>
                                  <Text style={styles.alternativeRecipeLinkText}>View Recipe</Text>
                                </Link>
                              </TouchableOpacity>
                            )}
                          </>
                        )}
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
              
              {/* Feedback Buttons */}
              <Animated.View style={styles.feedbackContainer}>
                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                  <TouchableOpacity
                    style={[styles.feedbackButton, styles.likeButton]}
                    onPress={() => handleFeedback('positive')}
                  >
                    <Text style={styles.buttonEmoji}>👍</Text>
                    <Text style={styles.buttonText}>Perfect!</Text>
                  </TouchableOpacity>
                </Animated.View>
                
                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                  <TouchableOpacity
                    style={[styles.feedbackButton, styles.tryAnotherButton]}
                    onPress={() => handleFeedback('alternative')}
                  >
                    <Text style={styles.buttonEmoji}>🔄</Text>
                    <Text style={styles.buttonText}>Try Again</Text>
                  </TouchableOpacity>
                </Animated.View>
                
                <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
                  <TouchableOpacity
                    style={[styles.feedbackButton, styles.tweakFeedbackButton]}
                    onPress={() => {
                      setTweakInput('');
                      setTimeout(() => {
                        setShowTweakSheet(true);
                      }, 100);
                    }}
                  >
                    <Text style={styles.buttonEmoji}>🔧</Text>
                    <Text style={styles.buttonText}>Tweak This</Text>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
              
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetQuiz}
              >
                <Text style={styles.resetButtonText}>Start Over</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : showRecommendation && !recommendation && error ? (
            <View style={styles.recommendationContainer}>
              <Text style={styles.recommendationTitle}>No Recommendation</Text>
              <Text style={styles.recommendationTitle}>Try again or adjust your quiz answers.</Text>
            </View>
          ) : (
            <View style={styles.recommendationContainer}>
              <Text style={styles.recommendationTitle}>No Recommendation</Text>
              <Text style={styles.drinkDescription}>
                🧠 I need a moment. Grab a sip of water while I rethink your drink!
              </Text>
            </View>
          )}
        </ScrollView>
        
        {/* Tweak This InputBar - replaces BottomInputSheet */}
        <InputBar
          value={tweakInput}
          onChangeText={setTweakInput}
          onSend={handleTweakSend}
          placeholder="Describe how you'd like to tweak your drink..."
          autoFocus
          visible={showTweakSheet}
        />
      </SafeAreaView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  welcomeBannerContainer: {
    backgroundColor: '#1a2233',
    borderRadius: 16,
    padding: 28,
    marginHorizontal: 10,
    marginTop: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  welcomeBannerText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 18,
    letterSpacing: 0.2,
  },
  startButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  quizContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#2C3E50',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  recommendationContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 15,
  },
  recommendationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  mainSuggestionCard: {
    backgroundColor: '#2C3E50',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  drinkDescription: {
    fontSize: 16,
    color: '#ddd',
    marginBottom: 15,
    lineHeight: 22,
  },
  recipeLinkButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  recipeLinkText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  safetyTipContainer: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  safetyTipText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 22,
  },
  alternativesContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 15,
    marginVertical: 15,
  },
  alternativesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  alternativesScrollContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingVertical: 10,
  },
  alternativeHorizontalCard: {
    backgroundColor: '#2C3E50',
    padding: 15,
    borderRadius: 12,
    width: 250,
    marginRight: 15,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  alternativeFeeling: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  alternativeName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  alternativeDescription: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 18,
  },
  suggestionItem: {
    padding: 10,
    backgroundColor: '#34495e',
    borderRadius: 10,
    marginBottom: 10,
  },
  suggestionName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  suggestionDescription: {
    fontSize: 13,
    color: '#ddd',
    marginBottom: 5,
    lineHeight: 18,
  },
  alternativeRecipeLink: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  alternativeRecipeLinkText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  feedbackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  feedbackButton: {
    backgroundColor: '#2C3E50',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  likeButton: {
    backgroundColor: '#27ae60',
  },
  tryAnotherButton: {
    backgroundColor: '#3498db',
  },
  tweakFeedbackButton: {
    backgroundColor: '#9b59b6',
  },
  buttonEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#34495e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginHorizontal: 20,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  vibeSummaryContainer: {
    backgroundColor: '#9b59b6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 30,
    marginBottom: 10,
  },
  vibeSummaryMessage: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});