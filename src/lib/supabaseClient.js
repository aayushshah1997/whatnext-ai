import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values'; // Required for uuid to work in React Native

// Initialize Supabase client
const supabaseUrl = 'https://wzpkeknpyyctsgqflrhs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cGtla25weXljdHNncWZscmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTM0NzEsImV4cCI6MjA2MDY2OTQ3MX0.9DTPhYjRY1kXMSQtxOScfCU6zj0lKNR8ZeYpWL_gLts';

// Export these for easy reference in health checks
export { supabaseUrl, supabaseAnonKey };

// --- Temporarily Mocked AsyncStorage for Debugging ---
const inMemoryStore = {};
const mockedCustomStorage = {
  getItem: async (key) => {
    // console.log(`[MockedStorage] getItem: ${key}`);
    return inMemoryStore[key] || null;
  },
  setItem: async (key, value) => {
    // console.log(`[MockedStorage] setItem: ${key}`);
    inMemoryStore[key] = value;
  },
  removeItem: async (key) => {
    // console.log(`[MockedStorage] removeItem: ${key}`);
    delete inMemoryStore[key];
  },
};
// --- End Mocked AsyncStorage ---

// Custom storage implementation with error handling
const customStorage = {
  getItem: async (key) => {
    try {
      // return await AsyncStorage.getItem(key); // Original
      return await mockedCustomStorage.getItem(key); // Debug
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      // await AsyncStorage.setItem(key, value); // Original
      await mockedCustomStorage.setItem(key, value); // Debug
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  },
  removeItem: async (key) => {
    try {
      // await AsyncStorage.removeItem(key); // Original
      await mockedCustomStorage.removeItem(key); // Debug
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  }
};

// Create Supabase client with recommended settings and custom storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: false, // Temporarily disable session persistence for testing
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: { 'x-app-name': 'WhatNext-AI' },
  },
});

// Log Supabase initialization
console.log('Supabase client initialized with URL:', supabaseUrl);

// Safely clear offline mode flag on app start with proper error handling
const clearOfflineMode = () => {
  // Use our custom storage implementation
  customStorage.removeItem('offline_mode')
    .then(() => {
      console.log('Offline mode flag cleared on startup');
    })
    .catch(err => {
      console.error('Error clearing offline mode flag:', err);
    });
};

// Delay initialization to avoid React Native threading issues
let initializationTimeout;

// Safe initialization function
const safeInitialize = () => {
  try {
    // Clear any existing timeout
    if (initializationTimeout) {
      clearTimeout(initializationTimeout);
    }
    
    // Set a new timeout with a longer delay
    initializationTimeout = setTimeout(clearOfflineMode, 1000);
  } catch (error) {
    console.error('Error in safe initialization:', error);
  }
};

// Call safe initialization
safeInitialize();

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Clear offline mode flag first
    await customStorage.removeItem('offline_mode');
    
    // First, test basic connection
    const { data: pingData, error: pingError } = await supabase.rpc('pg_typeof', { arg: 1 }).single();
    
    if (pingError) {
      console.error('Basic connection test failed:', pingError);
      
      // Check if it's a connection error
      if (pingError.message.includes('Failed to fetch') || 
          pingError.message.includes('NetworkError') ||
          pingError.message.includes('network request failed')) {
        console.error('Network connection error. Check your internet connection.');
        // Do not set offline mode, just log the error
        return {
          success: false,
          error: 'Network connection error. Please check your internet connection.',
          details: pingError.message,
          recommendation: 'Ensure you have a stable internet connection and try again.'
        };
      }
      
      // Check if it's an authentication error
      if (pingError.code === 'invalid_api_key' || 
          pingError.message.includes('invalid api key') ||
          pingError.message.includes('JWT')) {
        console.error('Authentication error. Check your Supabase API key.');
        // Do not set offline mode, just log the error
        return {
          success: false,
          error: 'Authentication error. Invalid Supabase API key.',
          details: pingError.message,
          recommendation: 'Check your Supabase API key in the configuration.'
        };
      }
      
      // For any other basic connection error, don't set offline mode
      return {
        success: false,
        error: 'Supabase connection error',
        details: pingError.message,
        recommendation: 'Check your Supabase URL and API key.'
      };
    }
    
    console.log('Basic connection successful:', pingData);
    
    // Then try to access the users table
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error accessing users table:', error);
      
      if (error.code === '42P01') {
        console.error('Users table does not exist. Database may not be set up correctly.');
        // Do not set offline mode, just log the error
        return {
          success: false,
          error: 'Database schema error',
          details: 'The users table does not exist',
          recommendation: 'Run the database setup script to create the required tables.'
        };
      }
      
      // Check if it's a permissions error
      if (error.code === 'PGRST116' || 
          error.message.includes('permission denied') ||
          error.message.includes('access control')) {
        console.error('Row Level Security (RLS) error. Check your Supabase policies.');
        // Do not set offline mode, just log the error
        return {
          success: false,
          error: 'Row Level Security (RLS) error',
          details: error.message,
          recommendation: 'Check your Supabase RLS policies for the users table.'
        };
      }
      
      // For any other table access error, don't set offline mode
      return {
        success: false,
        error: 'Error accessing Supabase database',
        details: error.message,
        recommendation: 'Check your database schema and permissions.'
      };
    }
    
    // Clear offline mode flag if we successfully connected
    await customStorage.removeItem('offline_mode');
    
    console.log('Successfully connected to Supabase and accessed users table');
    return {
      success: true,
      message: 'Successfully connected to Supabase',
      details: 'Connection and database access verified'
    };
  } catch (error) {
    console.error('Exception during connection test:', error);
    
    // Do not set offline mode for unexpected errors
    return {
      success: false,
      error: 'Unexpected error testing Supabase connection',
      details: error.message,
      recommendation: 'Check your internet connection and Supabase configuration.'
    };
  }
};

// Get or create user
export const getOrCreateUser = async () => {
  try {
    console.log('Getting or creating user...');
    
    // Safely clear offline mode flag using custom storage
    await customStorage.removeItem('offline_mode');
    
    // First, try to get the user ID from custom storage
    const storedUserId = await customStorage.getItem('user_id');
    
    // If no user ID found, create a new user
    if (!storedUserId) {
      console.log('No user ID found in storage, creating new user');
      return createNewUser();
    }
    
    // If user ID found, check for user data in Supabase
    console.log(`User ID ${storedUserId} found in storage, checking Supabase...`);
    
    // Check last successful check timestamp
    const lastCheckTimestampStr = await customStorage.getItem('last_user_check_timestamp');

    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    if (lastCheckTimestampStr) {
      const lastCheckTimestamp = parseInt(lastCheckTimestampStr, 10);
      if (now - lastCheckTimestamp < oneHour) {
        // console.log('User data checked recently, using cached data if available...');
        const storedUserData = await customStorage.getItem('user_data');
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          console.log('Using recently cached user data:', parsedUserData.username);
          return {
            ...parsedUserData,
            id: storedUserId,
            _storageMode: 'supabase' // Assume it was from supabase
          };
        }
      }
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', storedUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: 'No rows found'
      console.error('Error fetching user from Supabase:', error);
      // Fallback to custom storage if Supabase fails, but still indicate potential issue
      const storedUserData = await customStorage.getItem('user_data');
      if (storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        console.warn('Supabase fetch failed, using potentially stale custom storage data for user:', parsedUserData.username);
        return {
          ...parsedUserData,
          id: storedUserId,
          _storageMode: 'asyncStorage_fallback_after_error'
        };
      }
      // If no custom storage data either, create new user (should ideally not happen if ID was stored)
      console.warn('Supabase fetch failed and no custom storage data, attempting to create new user for existing ID. This is unusual.');
      return createNewUser(); 
    }

    if (user) {
      console.log('User found in Supabase:', user.username);
      await customStorage.setItem('user_data', JSON.stringify(user));
      await customStorage.setItem('last_user_check_timestamp', now.toString());
      return { ...user, _storageMode: 'supabase' };
    }
    
    // If user not found in Supabase despite having an ID, it's an orphaned ID.
    // This could happen if DB was cleared but custom storage wasn't.
    console.warn(`User ID ${storedUserId} found in storage, but no user in Supabase. Creating new user.`);
    // Clear the orphaned ID and associated data from storage
    await customStorage.removeItem('user_id');
    await customStorage.removeItem('user_data');
    await customStorage.removeItem('last_user_check_timestamp');
    return createNewUser();

  } catch (error) {
    console.error('Critical error in getOrCreateUser:', error);
    // As a last resort, try to get from custom storage to prevent total failure
    try {
      console.warn('Critical error led to custom storage direct check in getOrCreateUser');
      const storedUserId = await customStorage.getItem('user_id');
      const storedUserData = await customStorage.getItem('user_data');
      
      if (storedUserId && storedUserData) {
        const parsedUserData = JSON.parse(storedUserData);
        console.log('Using cached user data from custom storage after critical error:', parsedUserData.username);
        
        return {
          ...parsedUserData,
          id: storedUserId,
          _storageMode: 'asyncStorage_critical_fallback' 
        };
      }
    } catch (asyncError) {
      console.error('Error getting user from custom storage during critical fallback:', asyncError);
    }
    
    // If all else fails, create a new user (this will use the mocked storage)
    return createNewUser();
  }
};

// Create a new user
export const createNewUser = async () => {
  try {
    console.log('Creating new user...');
    
    // Always clear offline mode flag using custom storage
    await customStorage.removeItem('offline_mode');
    
    // Generate a new UUID with error handling
    let newUserId;
    try {
      // newUserId = uuidv4(); // Temporarily commented out for testing
      newUserId = `user_uuid_bypassed_${Date.now()}`; // Bypass uuidv4 for testing
      console.log('Bypassed UUID generation, using:', newUserId);
    } catch (uuidError) {
      console.error('Error generating UUID (or during bypass logic):', uuidError);
      // Fallback to timestamp-based ID if UUID (or bypass) fails, though bypass itself shouldn't fail here.
      newUserId = `user_${Date.now()}`;
    }
    
    // Generate a random username
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const newUsername = `user_${randomSuffix}`;
    
    const userData = {
      id: newUserId,
      username: newUsername,
      first_name: '',
      last_name: '',
      email: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Try to save to Supabase first
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single(); // Assuming you want the inserted row back
      
    if (error) {
      console.error('Error saving new user to Supabase:', error);
      // Fallback to custom storage (which is mocked for now)
      console.log('Falling back to custom storage for new user.');
      // await AsyncStorage.setItem('user_id', newUserId); // Original
      await customStorage.setItem('user_id', newUserId); // Use customStorage
      // await AsyncStorage.setItem('user_data', JSON.stringify(userData)); // Original
      await customStorage.setItem('user_data', JSON.stringify(userData)); // Use customStorage
      return { ...userData, _storageMode: 'asyncStorage_new_user_fallback' }; 
    }

    if (data) {
      console.log('New user saved to Supabase and custom storage:', data.username);
      // Save to custom storage as well for consistency
      // await AsyncStorage.setItem('user_id', newUserId); // Original
      await customStorage.setItem('user_id', newUserId); // Use customStorage
      // await AsyncStorage.setItem('user_data', JSON.stringify(data)); // Original
      await customStorage.setItem('user_data', JSON.stringify(data)); // Use customStorage
      // await AsyncStorage.setItem('last_user_check_timestamp', Date.now().toString()); // Original
      await customStorage.setItem('last_user_check_timestamp', Date.now().toString()); // Use customStorage
      return { ...data, _storageMode: 'supabase' };
    }
    
    // Should not happen if insert succeeded without error but no data
    console.warn('New user insert to Supabase reported success but no data returned. Using local data.');
    // await AsyncStorage.setItem('user_id', newUserId); // Original
    await customStorage.setItem('user_id', newUserId); // Use customStorage
    // await AsyncStorage.setItem('user_data', JSON.stringify(userData)); // Original
    await customStorage.setItem('user_data', JSON.stringify(userData)); // Use customStorage
    return {
      ...userData,
      _storageMode: 'asyncStorage_after_empty_supabase_response'
    };

  } catch (error) {
    console.error('Error creating new user:', error);
    // Return a minimal user object as last resort to prevent app crash
    // This will also use the mocked storage for id/data if it attempts to save
    return {
      id: `emergency_${Date.now()}`,
      username: 'emergency_user',
      _storageMode: 'emergency',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
};

// Game functions
export const saveGameScore = async (userId, gameName, score, metadata = {}) => {
  try {
    console.log(`Saving score for ${gameName}: ${score} for user ${userId}`);
    
    // Always try to save to Supabase first
    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .insert({
          user_id: userId,
          game_name: gameName,
          score: score, // Ensure score is saved correctly
          game_specific_data: metadata, // Corrected from 'metadata'
          created_at: new Date().toISOString()
        })
        .select()
        .single(); // Assuming you want the inserted row back
      
      if (error) {
        console.error('Error saving game score to Supabase:', error);
        // Set offline mode using custom storage if Supabase fails
        await customStorage.setItem('offline_mode', 'true');
        throw error; // Re-throw to be caught by outer catch block for customStorage fallback
      }
      
      console.log('Game score saved to Supabase:', data);
      // Clear offline mode if Supabase save is successful
      await customStorage.removeItem('offline_mode');
      return { ...data, saved_to: 'supabase' };

    } catch (supabaseError) {
      // This catch block handles errors from Supabase insert OR if offline_mode was already set
      console.warn('Supabase save failed or in offline mode, falling back to customStorage for game score.');
      
      try {
        const gameScoresKey = `game_scores_${gameName}_${userId}`;
        // const existingScoresStr = await AsyncStorage.getItem(gameScoresKey); // Original
        const existingScoresStr = await customStorage.getItem(gameScoresKey); // Use customStorage
        const existingScores = existingScoresStr ? JSON.parse(existingScoresStr) : [];
        
        existingScores.push({ score, metadata, timestamp: new Date().toISOString() });
        // await AsyncStorage.setItem(gameScoresKey, JSON.stringify(existingScores)); // Original
        await customStorage.setItem(gameScoresKey, JSON.stringify(existingScores)); // Use customStorage
        
        // Also update high score in customStorage
        const highScoreKey = `high_score_${gameName}_${userId}`;
        // const currentHighScoreStr = await AsyncStorage.getItem(highScoreKey); // Original
        const currentHighScoreStr = await customStorage.getItem(highScoreKey); // Use customStorage
        const currentHighScore = currentHighScoreStr ? parseInt(currentHighScoreStr, 10) : 0;
        
        if (score > currentHighScore) {
          // await AsyncStorage.setItem(highScoreKey, score.toString()); // Original
          await customStorage.setItem(highScoreKey, score.toString()); // Use customStorage
          console.log(`New high score for ${gameName} saved to customStorage: ${score}`);
        }
        
        return { score, metadata, saved_to: 'customstorage_fallback' };
      } catch (asyncError) {
        console.error('Error saving to customStorage after Supabase failure:', asyncError);
        throw asyncError; // Propagate error if customStorage also fails
      }
    }
  } catch (error) {
    // This catches errors from the customStorage fallback itself, or other unexpected errors
    console.error('Critical error in saveGameScore:', error);
    throw error;
  }
};

// Get game high score
export const getGameHighScore = async (userId, gameName) => {
  try {
    const highScoreKey = `high_score_${gameName}_${userId}`;
    // const highScoreStr = await AsyncStorage.getItem(highScoreKey); // Original
    const highScoreStr = await customStorage.getItem(highScoreKey); // Use customStorage
    return highScoreStr ? parseInt(highScoreStr, 10) : 0;
  } catch (error) {
    console.error('Error getting game high score from customStorage:', error);
    return 0;
  }
};

// Get game leaderboard
export const getGameLeaderboard = async (gameName, limit = 10) => {
  try {
    console.log(`Fetching leaderboard for ${gameName}, limit: ${limit}`);
    
    // Always clear offline mode before fetching leaderboard (using mocked customStorage)
    await customStorage.removeItem('offline_mode');
    
    console.log(`Fetching ${gameName} leaderboard data from Supabase...`);
    
    // Get all scores for this game
    // Corrected to use 'game_specific_data' if that's the actual column, or remove if not needed for leaderboard
    const { data, error } = await supabase
      .from('game_sessions_leaderboard') // Use the view here
      .select('user_id, username, top_score') // Select from the view
      .eq('game_name', gameName)
      .order('top_score', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error(`Error fetching ${gameName} leaderboard from Supabase:`, error);
      // Set offline mode if Supabase fails
      await customStorage.setItem('offline_mode', 'true');
      // Fallback to customStorage if needed (though leaderboard usually needs fresh data)
      // For now, just return empty on error if Supabase fails, as local leaderboard is complex
      return []; 
    }
    
    if (!data) {
      console.warn(`${gameName} leaderboard data is null or undefined from Supabase.`);
      return [];
    }
    
    console.log(`Raw ${gameName} leaderboard from Supabase:`, data);
    
    // The view should already provide username, so direct mapping is simpler
    const leaderboardData = data.map(item => ({
      username: item.username || 'Unknown Player', // Handle null usernames from view
      top_score: item.top_score
    }));    

    console.log(`Final ${gameName} leaderboard:`, leaderboardData);
    return leaderboardData;

  } catch (error) {
    // Catch any other error, including potential issues with customStorage itself if it weren't mocked
    console.error(`Exception in ${gameName} leaderboard processing:`, error);
    // Attempt to set offline mode on general failure too
    try {
      await customStorage.setItem('offline_mode', 'true');
    } catch (e) { console.error("Failed to set offline_mode in leaderboard catch", e); }
    return [];
  }
};

// Subscribe to leaderboard changes
export const subscribeToLeaderboardChanges = (gameName, callback) => {
  console.log(`Subscribing to leaderboard changes for ${gameName}`);
  return supabase
    .channel(`game_sessions_leaderboard_changes_${gameName}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_sessions_leaderboard', // Listen to changes on the VIEW
        // filter: `game_name=eq.${gameName}` // Filter might not work well on views or be needed if view is specific enough
      },
      (payload) => {
        console.log(`${gameName} leaderboard subscription payload:`, payload);
        callback(payload);
      }
    )
    .subscribe((status, err) => {
      if (err) {
        console.error(`Error subscribing to ${gameName} leaderboard:`, err);
      }
      console.log(`${gameName} leaderboard subscription status: ${status}`);
    });
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    // Check if we're in offline mode (using mocked customStorage)
    const offlineMode = await customStorage.getItem('offline_mode');
    const isOffline = offlineMode === 'true';

    if (isOffline) {
      console.log('Updating user profile in offline mode (customStorage)...');
      // const storedUserData = await AsyncStorage.getItem('user_data'); // Original
      const storedUserData = await customStorage.getItem('user_data'); // Use customStorage
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        const updatedData = { ...parsedData, ...updates, updated_at: new Date().toISOString() };
        // await AsyncStorage.setItem('user_data', JSON.stringify(updatedData)); // Original
        await customStorage.setItem('user_data', JSON.stringify(updatedData)); // Use customStorage
        return { data: updatedData, error: null, offlineMode: true };
      } else {
        return { data: null, error: { message: 'User data not found in offline storage' }, offlineMode: true };
      }
    }

    // Online mode: Update Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile in Supabase:', error);
      // If Supabase update fails, attempt to update customStorage as a fallback
      try {
        // const storedUserData = await AsyncStorage.getItem('user_data'); // Original
        const storedUserData = await customStorage.getItem('user_data'); // Use customStorage
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          const updatedData = { ...parsedData, ...updates, updated_at: new Date().toISOString() };
          // await AsyncStorage.setItem('user_data', JSON.stringify(updatedData)); // Original
          await customStorage.setItem('user_data', JSON.stringify(updatedData)); // Use customStorage
          console.warn('Supabase update failed, user profile updated in customStorage instead.');
          return { data: updatedData, error, offlineMode: true, fallback: true }; // Indicate fallback
        }
      } catch (asyncError) {
        console.error('Error updating customStorage after Supabase failure:', asyncError);
      }
      return { data: null, error };
    }
    
    // Also update customStorage with the latest data from Supabase
    if (data) {
      // await AsyncStorage.setItem('user_data', JSON.stringify(data)); // Original
      await customStorage.setItem('user_data', JSON.stringify(data)); // Use customStorage
    }
    return { data, error: null };
  } catch (error) {
    console.error('Exception in updateUserProfile:', error);
    return { data: null, error };
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    // Check if we're in offline mode (using mocked customStorage)
    const offlineMode = await customStorage.getItem('offline_mode');
    const isOffline = offlineMode === 'true';

    if (isOffline) {
      console.log('Getting user profile in offline mode (customStorage)...');
      // const storedUserData = await AsyncStorage.getItem('user_data'); // Original
      const storedUserData = await customStorage.getItem('user_data'); // Use customStorage
      if (storedUserData) {
        return { data: JSON.parse(storedUserData), error: null, offlineMode: true };
      }
      return { data: null, error: { message: 'User data not found in offline storage' }, offlineMode: true };
    }

    // Online mode: Fetch from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
      console.error('Error fetching user profile from Supabase:', error);
      // Fallback to customStorage if Supabase fetch fails
      try {
        // const storedUserData = await AsyncStorage.getItem('user_data'); // Original
        const storedUserData = await customStorage.getItem('user_data'); // Use customStorage
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          console.warn('Supabase fetch failed, returning user profile from customStorage.');
          return { data: parsedData, error, offlineMode: true, fallback: true }; // Indicate fallback
        }
      } catch (asyncError) {
        console.error('Error fetching from customStorage after Supabase failure:', asyncError);
      }
      return { data: null, error };
    }

    if (data) {
      // Update customStorage with the latest data from Supabase
      // await AsyncStorage.setItem('user_data', JSON.stringify(data)); // Original
      await customStorage.setItem('user_data', JSON.stringify(data)); // Use customStorage
    }
    return { data, error: null };
  } catch (error) {
    console.error('Exception in getUserProfile:', error);
    return { data: null, error };
  }
};

// Save Drink Quiz Results
export const saveDrinkQuiz = async ({ userId, quizParams, aiResult, vibeScore = 0 }) => {
  if (!userId) {
    console.error('saveDrinkQuiz called without userId. Quiz result cannot be saved to Supabase without a user.');
    // Depending on your app's logic, you might want to save this to AsyncStorage/customStorage
    // and sync later if a user logs in or an anonymous user ID is established.
    // For now, returning an error to indicate failure.
    return { data: null, error: new Error('User ID is required to save drink quiz results.'), offlineMode: true, fallback: true };
  }

  try {
    const { data, error } = await supabase
      .from('drink_quiz_results')
      .insert([
        {
          user_id: userId,
          quiz_params: quizParams, // Ensure this is a valid JSON object
          ai_result: aiResult,     // Ensure this is a valid JSON object
          vibe_score: vibeScore,
        },
      ])
      .select() // Fetches the inserted row(s)
      .single(); // Assumes you are inserting one quiz result and want that single record back

    if (error) {
      console.error('Error saving drink quiz results to Supabase:', error);
      // Implement fallback to customStorage if Supabase operation fails, similar to other functions
      try {
        const localQuizResults = JSON.parse(await customStorage.getItem('drink_quiz_results_offline')) || [];
        const newQuizEntry = {
          id: `offline_${userId}_${new Date().toISOString()}`, // Unique ID for offline entry
          user_id: userId,
          quiz_params: quizParams,
          ai_result: aiResult,
          vibe_score: vibeScore,
          created_at: new Date().toISOString(),
          needs_sync: true // Flag to indicate it needs syncing with Supabase later
        };
        localQuizResults.push(newQuizEntry);
        await customStorage.setItem('drink_quiz_results_offline', JSON.stringify(localQuizResults));
        console.warn('Supabase saveDrinkQuiz failed. Result saved to customStorage for later sync.');
        // Return the locally saved data structure, marking it as an offline fallback
        return { data: newQuizEntry, error, offlineMode: true, fallback: true };
      } catch (storageError) {
        console.error('Error saving quiz result to customStorage after Supabase failure:', storageError);
        // If fallback storage also fails, return the original Supabase error
        return { data: null, error, offlineMode: true, fallback: true };
      }
    }

    if (data) {
        console.log('Drink quiz results saved successfully to Supabase:', data);
    }
    return { data, error: null, offlineMode: false, fallback: false };
  } catch (e) {
    console.error('Exception in saveDrinkQuiz:', e);
    // Fallback to customStorage on generic exception
     try {
        const localQuizResults = JSON.parse(await customStorage.getItem('drink_quiz_results_offline')) || [];
        const newQuizEntry = {
          id: `offline_exception_${userId}_${new Date().toISOString()}`,
          user_id: userId,
          quiz_params: quizParams,
          ai_result: aiResult,
          vibe_score: vibeScore,
          created_at: new Date().toISOString(),
          needs_sync: true
        };
        localQuizResults.push(newQuizEntry);
        await customStorage.setItem('drink_quiz_results_offline', JSON.stringify(localQuizResults));
        console.warn('Supabase exception in saveDrinkQuiz. Result saved to customStorage for later sync.');
        return { data: newQuizEntry, error: e, offlineMode: true, fallback: true };
      } catch (storageError) {
        console.error('Error saving quiz result to customStorage after Supabase exception:', storageError);
      }
    return { data: null, error: e, offlineMode: true, fallback: true };
  }
};

// Get Last Drink Quiz Results
export const getLastDrinkQuiz = async (userId) => {
  console.log(`Getting last drink quiz for user: ${userId}`);
  if (!userId) {
    console.warn('getLastDrinkQuiz called without userId');
    return { data: null, error: { message: 'User ID is required.' } };
  }

  const offlineMode = await customStorage.getItem('offline_mode');
  if (offlineMode === 'true') {
    console.log('Offline mode: Attempting to retrieve last drink quiz from AsyncStorage');
    try {
      const localQuizData = await customStorage.getItem(`last_drink_quiz_${userId}`);
      if (localQuizData) {
        console.log('Found last drink quiz in AsyncStorage');
        return { data: JSON.parse(localQuizData), error: null };
      }
      console.log('No last drink quiz found in AsyncStorage');
      return { data: null, error: { message: 'Offline and no local data.' } };
    } catch (error) {
      console.error('Error retrieving last drink quiz from AsyncStorage:', error);
      return { data: null, error };
    }
  }

  try {
    const { data, error } = await supabase
      .from('drink_quiz_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(); // .single() will return one object or null

    if (error && error.code !== 'PGRST116') { // PGRST116: 'Searched for one object, but found 0 rows'
      console.error('Error fetching last drink quiz:', error);
      // Consider setting offline mode if Supabase is unreachable
      if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        await customStorage.setItem('offline_mode', 'true');
        console.warn('Supabase unreachable, set to offline mode.');
      }
      return { data: null, error };
    }

    if (data) {
      console.log('Last drink quiz fetched successfully:', data);
      // Save to AsyncStorage for offline access
      await customStorage.setItem(`last_drink_quiz_${userId}`, JSON.stringify(data));
    } else {
      console.log('No previous drink quiz found for this user.');
    }
    
    return { data, error: null }; // error will be null if PGRST116 or success

  } catch (error) {
    console.error('Unexpected error in getLastDrinkQuiz:', error);
    // Fallback to AsyncStorage if unexpected error occurs, ensure offline_mode is considered
     if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        await customStorage.setItem('offline_mode', 'true');
        console.warn('Supabase unreachable during critical error, set to offline mode.');
      } 
    return { data: null, error };
  }
};

// Chat functions
export const logChat = async (userId, role, content) => {
  try {
    // Check for offline mode (using mocked customStorage)
    const offlineMode = await customStorage.getItem('offline_mode');
    if (offlineMode === 'true') {
      console.log('Offline mode: Chat message not logged to Supabase.');
      // Optionally, save to customStorage here if offline chat logging is desired
      return { data: null, error: { message: 'Offline mode, not logged' }, offlineMode: true };
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ user_id: userId, role, content })
      .select();

    if (error) {
      console.error('Error logging chat message:', error);
      await customStorage.setItem('offline_mode', 'true'); // Set offline on error
      return { data: null, error };
    }
    return { data, error: null };
  } catch (error) {
    console.error('Exception in logChat:', error);
    try { await customStorage.setItem('offline_mode', 'true'); } catch(e) {}
    return { data: null, error };
  }
};

export const getChatHistory = async (userId, limit = 20) => {
  try {
    // Check for offline mode (using mocked customStorage)
    const offlineMode = await customStorage.getItem('offline_mode');
    if (offlineMode === 'true') {
      console.log('Offline mode: Chat history not fetched from Supabase.');
      // Optionally, retrieve from customStorage here if offline chat history is desired
      return { data: [], error: { message: 'Offline mode, history not fetched' }, offlineMode: true };
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching chat history:', error);
      await customStorage.setItem('offline_mode', 'true'); // Set offline on error
      return { data: [], error };
    }
    return { data: data ? data.reverse() : [], error: null }; // Reverse to show oldest first
  } catch (error) {
    console.error('Exception in getChatHistory:', error);
    try { await customStorage.setItem('offline_mode', 'true'); } catch(e) {}
    return { data: [], error };
  }
};

// App session tracking
export const trackAppSession = async (userId) => {
  try {
    if (!userId) {
      console.warn('trackAppSession called without userId, skipping.');
      // Return a no-op endSession function
      return { endSession: async () => { console.warn('endSession called without a valid session.'); return 0; } };
    }

    // Create a new session when app opens
    const sessionStart = new Date();
    
    // Check for offline mode (using mocked customStorage)
    const offlineMode = await customStorage.getItem('offline_mode');
    if (offlineMode === 'true') {
      console.log('Offline mode: App session not logged to Supabase.');
      // Store session locally if needed, or just return a no-op for now
      // For simplicity, we'll just log and return a no-op endSession
      const localSessionId = `local_session_${Date.now()}`;
      console.log(`Offline session started locally: ${localSessionId}`);
      return {
        endSession: async () => {
          console.log(`Offline session ${localSessionId} ended locally.`);
          return 0; // No duration tracking for this simplified offline version
        }
      };
    }
    
    // Online mode: try to store session ID for later updating
    const { data: sessionData, error } = await supabase
      .from('app_sessions')
      .insert({
        user_id: userId,
        session_start: sessionStart.toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error starting app session in Supabase:', error);
      await customStorage.setItem('offline_mode', 'true'); // Set offline on error
      // Even if Supabase fails, return a no-op endSession to prevent crashes
      return { endSession: async () => { console.warn('endSession called after Supabase start-session error.'); return 0; } };
    }

    if (!sessionData) {
        console.error('No session data returned from Supabase, cannot track session end.');
        return { endSession: async () => { console.warn('endSession called but no sessionData available.'); return 0; } };
    }
    
    console.log('App session started in Supabase, ID:', sessionData.id);
    // Return a function to end the session
    return {
      endSession: async () => {
        const sessionEnd = new Date();
        const durationSeconds = Math.floor((sessionEnd.getTime() - sessionStart.getTime()) / 1000);
        
        // Check for offline mode again before trying to end session in Supabase
        const endSessionOfflineMode = await customStorage.getItem('offline_mode');
        if (endSessionOfflineMode === 'true') {
          console.log(`Offline mode at session end: App session ${sessionData.id} not updated in Supabase.`);
          return durationSeconds; // Return duration, but don't try to update Supabase
        }

        const { error: updateError } = await supabase
          .from('app_sessions')
          .update({
            session_end: sessionEnd.toISOString(),
            duration_seconds: durationSeconds,
          })
          .eq('id', sessionData.id);
        
        if (updateError) {
          console.error('Error ending app session in Supabase:', updateError);
          await customStorage.setItem('offline_mode', 'true'); // Set offline on error
          // Fall through to return duration even if Supabase update fails
        }
        console.log('App session ended in Supabase, ID:', sessionData.id, 'Duration:', durationSeconds);
        return durationSeconds;
      }
    };
  } catch (error) {
    console.error('Critical error tracking app session:', error);
    // Fallback to prevent app crash: return a no-op endSession function
    try { await customStorage.setItem('offline_mode', 'true'); } catch(e) {}
    return { endSession: async () => { console.warn('endSession called after critical error in trackAppSession.'); return 0; } };
  }
};

// Placeholder for other functions that will be restored in subsequent steps
// END OF FILE (for now, more functions to be added back)
