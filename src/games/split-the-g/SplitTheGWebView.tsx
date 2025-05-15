import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { supabase, getUserHighScore, getOrCreateUser } from '../../lib/supabase/supabaseClient';

interface WebViewMessage {
  type: string;
  score?: number;
  level?: number;
  result?: string;
  imageData?: string; // Base64 encoded image
  analysis?: any; // Analysis data from the website
  barName?: string; // Name of the bar/pub
  barLocation?: string; // Location of the bar/pub
  pourRating?: number; // User rating of the pour
  pourNotes?: string; // Any notes about the pour
}

export default function SplitTheGWebView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Get user data
      const userData = await getOrCreateUser();
      if (userData) {
        setUserId(userData.id || null);
        setUsername(userData.username || 'Player');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleWebViewMessage = async (event: any) => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log('WebView message received:', data.type);
      
      if (data.type === 'gameResult' && data.score !== undefined) {
        console.log('Game result received:', data.score);
        console.log('Image data length:', data.imageData ? data.imageData.length : 'No image data');
        console.log('Analysis data:', data.analysis ? 'Present' : 'Not present');
        
        try {
          // Get or create a persistent user
          const persistentUser = await getOrCreateUser();
          if (!persistentUser || !persistentUser.id) {
            throw new Error('Failed to get or create a persistent user');
          }
          
          const persistentUserId = persistentUser.id;
          console.log('Using persistent user ID:', persistentUserId);
          
          // First check if the table exists
          const { data: tableExists, error: tableCheckError } = await supabase
            .from('split_the_g_game_sessions')
            .select('count')
            .limit(1);
          
          if (tableCheckError) {
            console.error('Table check error:', tableCheckError);
            
            // Table might not exist, try using the general game_sessions table
            console.log('Falling back to game_sessions table');
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('game_sessions')
              .insert([
                {
                  user_id: persistentUserId,
                  game_id: 'split-the-g',
                  score: data.score,
                  metadata: {
                    level: data.level,
                    result: data.result,
                    imageData: data.imageData ? data.imageData.substring(0, 100) + '...' : null, // Truncate for logging
                    analysis: data.analysis
                  }
                }
              ]);
            
            if (fallbackError) {
              console.error('Fallback insert error:', fallbackError);
              throw new Error(`Fallback insert failed: ${fallbackError.message}`);
            } else {
              console.log('Successfully saved to game_sessions table:', fallbackData);
            }
          } else {
            // Table exists, proceed with insert
            console.log('Table exists, proceeding with insert');
            const { data: insertData, error: insertError } = await supabase
              .from('split_the_g_game_sessions')
              .insert([
                {
                  user_id: persistentUserId,
                  score: data.score,
                  metadata: {
                    level: data.level,
                    result: data.result,
                    // Store the image data
                    imageData: data.imageData,
                    analysis: data.analysis
                  }
                }
              ]);
            
            if (insertError) {
              console.error('Insert error:', insertError);
              throw new Error(`Insert failed: ${insertError.message}`);
            } else {
              console.log('Successfully saved to split_the_g_game_sessions table:', insertData);
            }
          }
          
          // Get updated high score
          await getUserHighScore('split-the-g');
          
          // Show success message
          Alert.alert(
            'Score Saved!',
            `Your score of ${data.score} has been saved to Supabase.`,
            [{ text: 'OK' }]
          );
        } catch (supabaseError) {
          console.error('Supabase error:', supabaseError);
          
          // Store in AsyncStorage as fallback
          try {
            const storedScores = await AsyncStorage.getItem('split_the_g_scores');
            const scores = storedScores ? JSON.parse(storedScores) : [];
            const newScore = {
              id: Date.now().toString(),
              user_id: userId || 'anonymous',
              score: data.score,
              created_at: new Date().toISOString(),
              metadata: {
                level: data.level,
                result: data.result,
                // Don't store the full image in AsyncStorage
                imageData: data.imageData ? 'Image data stored' : null,
                analysis: data.analysis
              }
            };
            scores.push(newScore);
            await AsyncStorage.setItem('split_the_g_scores', JSON.stringify(scores));
            console.log('Saved to AsyncStorage as fallback');
            
            Alert.alert(
              'Score Saved Locally',
              `Your score of ${data.score} has been saved locally. It will be synced to the server when connection is restored.`,
              [{ text: 'OK' }]
            );
          } catch (asyncError) {
            console.error('AsyncStorage fallback error:', asyncError);
            Alert.alert('Error', 'Failed to save your score. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
      Alert.alert('Error', 'An error occurred while processing game data.');
    }
  };

  // JavaScript to inject into the WebView to capture game results
  const injectedJavaScript = `
    (function() {
      // Function to capture images from the game
      function captureGameImage() {
        try {
          // Look for the game canvas or image elements
          const gameCanvas = document.querySelector('canvas');
          const gameImage = document.querySelector('.game-image, .pint-image, img.pint');
          
          // Try to get image data from canvas
          if (gameCanvas) {
            return gameCanvas.toDataURL('image/jpeg', 0.7);
          }
          // Try to get image from img element
          else if (gameImage && gameImage.src) {
            return gameImage.src;
          }
          
          // If no specific element found, try to capture the game area
          const gameArea = document.querySelector('.game-area, .game-container, .pint-container');
          if (gameArea) {
            // Use html2canvas if available
            if (window.html2canvas) {
              window.html2canvas(gameArea).then(canvas => {
                return canvas.toDataURL('image/jpeg', 0.7);
              });
            }
          }
          
          return null;
        } catch (e) {
          console.error('Error capturing game image:', e);
          return null;
        }
      }
      
      // Function to extract analysis data from the game
      function extractAnalysisData() {
        try {
          // Look for analysis elements in the DOM
          const analysisElements = document.querySelectorAll('.analysis, .result-details, .split-analysis');
          const analysisData = {};
          
          analysisElements.forEach(element => {
            // Try to extract key-value pairs from the element
            const text = element.textContent;
            
            // Look for common patterns like "Split Level: 45%"
            const levelMatch = text.match(/Split Level[:\s]+(\d+)%/);
            if (levelMatch) {
              analysisData.splitLevel = parseInt(levelMatch[1], 10) / 100;
            }
            
            // Look for accuracy or other metrics
            const accuracyMatch = text.match(/Accuracy[:\s]+(\d+)%/);
            if (accuracyMatch) {
              analysisData.accuracy = parseInt(accuracyMatch[1], 10) / 100;
            }
            
            // Store the full text as well
            analysisData.fullText = text.trim();
          });
          
          return Object.keys(analysisData).length > 0 ? analysisData : null;
        } catch (e) {
          console.error('Error extracting analysis data:', e);
          return null;
        }
      }
      
      // Function to capture bar information and pour rating
      function captureBarInfoAndRating() {
        try {
          const barData = {};
          
          // Look for bar name input
          const barNameInput = document.querySelector('input[name="barName"], input[placeholder*="bar"], input[placeholder*="pub"], input[aria-label*="bar"]');
          if (barNameInput) {
            barData.barName = barNameInput.value;
          }
          
          // Look for location input
          const locationInput = document.querySelector('input[name="location"], input[placeholder*="location"], input[aria-label*="location"]');
          if (locationInput) {
            barData.barLocation = locationInput.value;
          }
          
          // Look for rating inputs (stars, sliders, or number inputs)
          const ratingInput = document.querySelector('input[type="range"], input[name="rating"], select[name="rating"], .rating-stars, .star-rating');
          if (ratingInput) {
            if (ratingInput.tagName === 'INPUT' && ratingInput.type === 'range') {
              barData.pourRating = parseFloat(ratingInput.value);
            } else if (ratingInput.tagName === 'SELECT') {
              barData.pourRating = parseFloat(ratingInput.value);
            } else {
              // Try to extract rating from star rating component
              const ratingText = ratingInput.textContent;
              const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
              if (ratingMatch) {
                barData.pourRating = parseFloat(ratingMatch[1]);
              }
            }
          }
          
          // Look for notes or comments textarea
          const notesInput = document.querySelector('textarea[name="notes"], textarea[placeholder*="note"], textarea[aria-label*="note"], textarea[placeholder*="comment"], textarea[aria-label*="comment"]');
          if (notesInput) {
            barData.pourNotes = notesInput.value;
          }
          
          return Object.keys(barData).length > 0 ? barData : null;
        } catch (e) {
          console.error('Error capturing bar information and rating:', e);
          return null;
        }
      }
      
      // Listen for game events
      window.addEventListener('message', function(event) {
        // Check if the message is from the game
        if (event.data && event.data.type === 'gameResult') {
          // Capture image, analysis data, and bar information
          const imageData = captureGameImage();
          const analysis = extractAnalysisData();
          const barInfo = captureBarInfoAndRating();
          
          // Send the enhanced data back to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            ...event.data,
            imageData: imageData,
            analysis: analysis,
            barName: barInfo?.barName,
            barLocation: barInfo?.barLocation,
            pourRating: barInfo?.pourRating,
            pourNotes: barInfo?.pourNotes
          }));
        }
      });
      
      // Override the game's score submission function if it exists
      if (window.submitScore) {
        const originalSubmit = window.submitScore;
        window.submitScore = function(score, level, result) {
          // Call the original function
          originalSubmit(score, level, result);
          
          // Capture image, analysis data, and bar information
          const imageData = captureGameImage();
          const analysis = extractAnalysisData();
          const barInfo = captureBarInfoAndRating();
          
          // Send enhanced data to React Native
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'gameResult',
            score: score,
            level: level,
            result: result,
            imageData: imageData,
            analysis: analysis,
            barName: barInfo?.barName,
            barLocation: barInfo?.barLocation,
            pourRating: barInfo?.pourRating,
            pourNotes: barInfo?.pourNotes
          }));
        };
      }
      
      // Monitor DOM for game events and results
      document.addEventListener('DOMContentLoaded', function() {
        const observer = new MutationObserver(function(mutations) {
          // Look for score elements and result screens
          const resultElements = document.querySelectorAll('.score, .final-score, .game-over, .result-screen');
          
          resultElements.forEach(function(element) {
            if (!element.getAttribute('data-listener')) {
              element.setAttribute('data-listener', 'true');
              
              element.addEventListener('click', function() {
                // Try to extract score information
                const scoreText = element.textContent;
                const scoreMatch = scoreText.match(/\d+/);
                
                if (scoreMatch) {
                  const score = parseInt(scoreMatch[0], 10);
                  
                  // Capture image, analysis data, and bar information
                  const imageData = captureGameImage();
                  const analysis = extractAnalysisData();
                  const barInfo = captureBarInfoAndRating();
                  
                  // Send enhanced data to React Native
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'gameResult',
                    score: score,
                    level: 0.5, // Default level
                    result: 'unknown',
                    imageData: imageData,
                    analysis: analysis,
                    barName: barInfo?.barName,
                    barLocation: barInfo?.barLocation,
                    pourRating: barInfo?.pourRating,
                    pourNotes: barInfo?.pourNotes
                  }));
                }
              });
            }
          });
          
          // Look for image capture events
          const captureButtons = document.querySelectorAll('.capture-button, .take-photo, button:contains("Capture"), button:contains("Take Photo")');
          
          captureButtons.forEach(function(button) {
            if (!button.getAttribute('data-capture-listener')) {
              button.setAttribute('data-capture-listener', 'true');
              
              button.addEventListener('click', function() {
                // Wait a moment for the image to be processed
                setTimeout(function() {
                  // Try to find the captured image
                  const capturedImage = document.querySelector('.captured-image, .preview-image');
                  if (capturedImage && capturedImage.src) {
                    // Store the image data for later use with the score
                    window.capturedImageData = capturedImage.src;
                  }
                }, 500);
              });
            }
          });
        });
        
        // Start observing the document
        observer.observe(document.body, { childList: true, subtree: true });
      });
      
      true;
    })();
  `;

  // Test function to verify Supabase connectivity
  const testSupabaseConnection = async () => {
    try {
      console.log('Testing Supabase connection...');
      
      // Get or create a persistent user
      const persistentUser = await getOrCreateUser();
      if (!persistentUser || !persistentUser.id) {
        throw new Error('Failed to get or create a persistent user');
      }
      
      console.log('Using persistent user ID:', persistentUser.id);
      
      // Test direct insert to Supabase with the persistent user ID
      const { data, error } = await supabase
        .from('split_the_g_game_sessions')
        .insert([
          {
            user_id: persistentUser.id,
            score: 100,
            metadata: {
              level: 0.5,
              result: 'test',
              testData: 'This is a test entry'
            }
          }
        ])
        .select();
      
      if (error) {
        console.error('Supabase test error:', error);
        Alert.alert('Supabase Error', `Failed to connect to Supabase: ${error.message}`);
      } else {
        console.log('Supabase test successful:', data);
        Alert.alert('Success', 'Test data saved to Supabase successfully!');
      }
    } catch (error) {
      console.error('Test function error:', error);
      Alert.alert('Error', `Test function failed: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Split the G</Text>
        <TouchableOpacity onPress={testSupabaseConnection} style={styles.testButton}>
          <Text style={styles.testButtonText}>Test Supabase</Text>
        </TouchableOpacity>
      </View>
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading Split the G...</Text>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://splittheg.dev/' }}
        style={[styles.webView, loading ? styles.hidden : {}]}
        onLoadEnd={() => setLoading(false)}
        onMessage={handleWebViewMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
    flex: 1,
  },
  testButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  testButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  webView: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    zIndex: 10,
  },
  loadingText: {
    color: '#FFD700',
    marginTop: 15,
    fontSize: 16,
  },
  hidden: {
    opacity: 0,
  },
});
