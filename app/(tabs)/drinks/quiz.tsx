import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIService } from '../../../config/ai';
import InputBar from '../../../src/components/InputBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenLayout from '../../../src/components/ScreenLayout';

const questions = [
  {
    question: 'Last drink?',
    options: ['Beer', 'Wine', 'Cocktails', 'Shots', 'Other'],
  },
  {
    question: 'Alcohol of choice?',
    options: ['Beer', 'Wine', 'Gin', 'Whiskey', 'Tequila', 'Vodka', 'Mezcal', 'Other'],
  },
  {
    question: 'How many drinks have you had so far?',
    options: ['0', '1', '2', '3', '4+'],
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
    options: ['Neat & Smooth', 'Sweet & Fruity', 'Citrusy', 'Bitter', 'Spicy', 'Other'],
  },
  {
    question: 'Who are you with?',
    options: ['Alone', 'Friends', 'Partner', 'Party Crowd'],
  },
];

// Define the quiz answer keys
const answerKeys = [
  'lastDrink',
  'alcoholPreference',
  'drinksConsumed',
  'mood',
  'flavorProfile',
  'socialContext',
] as const;

type QuizAnswers = {
  lastDrink: string;
  alcoholPreference: string;
  drinksConsumed: string;
  mood: string;
  flavorProfile: string;
  socialContext: string;
};

export default function QuizScreen() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // Initialize all required fields to empty string to match QuizAnswers type
  const [answers, setAnswers] = useState<QuizAnswers>({
    lastDrink: '',
    alcoholPreference: '',
    drinksConsumed: '',
    mood: '',
    flavorProfile: '',
    socialContext: '',
  });
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherInput, setOtherInput] = useState('');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Prevent advancing to next question when Other is selected
  useEffect(() => {
    if (showOtherInput) {
      console.log("Showing Other input field");
    }
  }, [showOtherInput]);

  const handleAnswer = async (answer: string) => {
    // Skip if we're in "Other" mode and trying to advance
    if (showOtherInput) {
      return;
    }
    
    const key = answerKeys[currentQuestion];
    const newAnswers = { ...answers, [key]: answer };
    setAnswers(newAnswers);
    
    if (currentQuestion < answerKeys.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Generate recommendation using Moses AI
      try {
        const aiService = AIService.getInstance();
        const recommendation = await aiService.generateDrinkRecommendation({
          quizAnswers: newAnswers
        });
        await AsyncStorage.setItem('lastRecommendation', recommendation);
        router.push('/drinks/recommendation');
      } catch (error) {
        console.error('Error getting recommendation:', error);
        Alert.alert('Error', 'Unable to get a recommendation. Please try again.');
      }
    }
  };

  const handleOtherSend = () => {
    if (!otherInput.trim()) return;
    
    // First set showOtherInput to false to prevent handleAnswer from being blocked
    setShowOtherInput(false);
    
    // Then handle the answer with the custom input
    const key = answerKeys[currentQuestion];
    const newAnswers = { ...answers, [key]: otherInput.trim() };
    setAnswers(newAnswers);
    
    // Clear the input
    setOtherInput('');
    
    // Advance to next question
    if (currentQuestion < answerKeys.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Generate recommendation using Moses AI
      (async () => {
        try {
          const aiService = AIService.getInstance();
          const recommendation = await aiService.generateDrinkRecommendation({
            quizAnswers: newAnswers
          });
          await AsyncStorage.setItem('lastRecommendation', recommendation);
          router.push('/drinks/recommendation');
        } catch (error) {
          console.error('Error getting recommendation:', error);
          Alert.alert('Error', 'Unable to get a recommendation. Please try again.');
        }
      })();
    }
  };

  return (
    <ScreenLayout>
      <View style={styles.container}>
        <Text style={styles.progress}>Question {currentQuestion + 1} of {questions.length}</Text>
        <Text style={styles.question}>{questions[currentQuestion].question}</Text>
        
        <ScrollView 
          style={styles.optionsContainer} 
          contentContainerStyle={{ paddingBottom: showOtherInput ? 80 : 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {questions[currentQuestion].options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionButton}
              onPress={() => {
                if (option === 'Other') {
                  // Just show the input, don't advance to next question
                  setShowOtherInput(true);
                } else {
                  handleAnswer(option);
                }
              }}
            >
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <InputBar
          value={otherInput}
          onChangeText={setOtherInput}
          onSend={handleOtherSend}
          placeholder="Enter your answer"
          autoFocus
          visible={showOtherInput}
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  progress: {
    color: '#888',
    fontSize: 16,
    marginBottom: 20,
    fontFamily: 'Inter-Regular',
  },
  question: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 30,
    fontFamily: 'Inter-Bold',
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});