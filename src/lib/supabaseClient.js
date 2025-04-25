import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values'; // Required for uuid to work in React Native

// Initialize Supabase client
const supabaseUrl = 'https://wzpkeknpyyctsgqflrhs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cGtla25weXljdHNncWZscmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTM0NzEsImV4cCI6MjA2MDY2OTQ3MX0.9DTPhYjRY1kXMSQtxOScfCU6zj0lKNR8ZeYpWL_gLts';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key (first 10 chars):', supabaseAnonKey.substring(0, 10) + '...');
    
    // Try to get the server timestamp
    const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error };
    }
    
    console.log('Supabase connection successful');
    return { success: true };
  } catch (error) {
    console.error('Supabase connection test exception:', error.message || error);
    return { success: false, error };
  }
};

// User management functions
export const getOrCreateUser = async () => {
  try {
    console.log('Starting getOrCreateUser function');
    // Check if user_id exists in AsyncStorage
    const userId = await AsyncStorage.getItem('user_id');
    console.log('User ID from AsyncStorage:', userId);
    
    if (userId) {
      // User exists, fetch their data
      console.log('Fetching existing user data from Supabase');
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user data:', error);
        throw error;
      }
      
      // If user found in database, return the user
      if (user) {
        console.log('User found in database:', user);
        return user;
      }
      
      // If user not found in database but exists in AsyncStorage,
      // create a new user with the stored ID
      console.log('User ID exists in AsyncStorage but not in database, creating new user');
      return await createNewUser(userId);
    } else {
      // No user_id in AsyncStorage, create a new user
      console.log('No user ID in AsyncStorage, creating new user');
      return await createNewUser();
    }
  } catch (error) {
    console.error('Error getting or creating user:', error.message || error);
    throw error;
  }
};

const createNewUser = async (userId = null) => {
  try {
    console.log('Starting createNewUser function', { providedUserId: userId });
    // Generate a random username if not provided
    const randomUsername = `user_${Math.random().toString(36).substring(2, 6)}`;
    console.log('Generated random username:', randomUsername);
    
    // Create a new user in the database
    const newUserId = userId || uuidv4();
    console.log('Using user ID:', newUserId);
    
    // Check if the users table exists
    console.log('Checking Supabase connection and table structure');
    const { error: tableError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing users table:', tableError);
      throw new Error(`Table access error: ${tableError.message || tableError}`);
    }
    
    console.log('Inserting new user into database');
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: newUserId,
        username: randomUsername,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error inserting new user:', error);
      throw new Error(`Insert error: ${error.message || error}`);
    }
    
    console.log('New user created successfully:', newUser);
    
    // Save user_id to AsyncStorage
    await AsyncStorage.setItem('user_id', newUserId);
    console.log('User ID saved to AsyncStorage');
    
    return newUser;
  } catch (error) {
    console.error('Error creating new user:', error.message || error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Chat functions
export const logChat = async (userId, role, message) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        role,
        message,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error logging chat message:', error);
    throw error;
  }
};

export const getChatHistory = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Return in chronological order (oldest first)
    return data.reverse();
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

// Drink quiz functions
export const saveDrinkQuiz = async (userId, quizParams, aiResult, vibeScore = 0) => {
  try {
    const { data, error } = await supabase
      .from('drink_quiz_results')
      .insert({
        user_id: userId,
        quiz_params: quizParams,
        ai_result: aiResult,
        vibe_score: vibeScore,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error saving drink quiz result:', error);
    throw error;
  }
};

export const getLastDrinkQuiz = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('drink_quiz_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
      throw error;
    }
    
    return data || null;
  } catch (error) {
    console.error('Error fetching last drink quiz:', error);
    throw error;
  }
};

// Game functions
export const saveGameScore = async (userId, gameName, score, metadata = {}) => {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        game_name: gameName,
        score,
        metadata,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error saving game score:', error);
    throw error;
  }
};

export const getGameLeaderboard = async (gameName, limit = 10) => {
  try {
    let query;
    
    if (gameName === 'Sloppy Birds') {
      // Use the view for Sloppy Birds
      const { data, error } = await supabase
        .from('sloppy_bird_leaderboard')
        .select('*')
        .limit(limit);
      
      if (error) throw error;
      return data;
    } else {
      // Generic query for other games
      const { data, error } = await supabase
        .from('game_sessions')
        .select('users(username), score')
        .eq('game_name', gameName)
        .order('score', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data.map(item => ({
        username: item.users.username,
        top_score: item.score
      }));
    }
  } catch (error) {
    console.error('Error fetching game leaderboard:', error);
    throw error;
  }
};

// Subscribe to leaderboard changes
export const subscribeToLeaderboardChanges = (gameName, callback) => {
  return supabase
    .channel('game_sessions_changes')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'game_sessions',
        filter: `game_name=eq.${gameName}`
      }, 
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
};

// App session tracking
export const trackAppSession = async (userId) => {
  try {
    // Create a new session when app opens
    const sessionStart = new Date();
    
    // Store session ID for later updating
    const { data: sessionData, error } = await supabase
      .from('app_sessions')
      .insert({
        user_id: userId,
        session_start: sessionStart.toISOString(),
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Return a function to end the session
    return {
      endSession: async () => {
        const sessionEnd = new Date();
        const durationSeconds = Math.floor((sessionEnd - sessionStart) / 1000);
        
        const { error: updateError } = await supabase
          .from('app_sessions')
          .update({
            session_end: sessionEnd.toISOString(),
            duration_seconds: durationSeconds,
          })
          .eq('id', sessionData.id);
        
        if (updateError) throw updateError;
        
        return durationSeconds;
      }
    };
  } catch (error) {
    console.error('Error tracking app session:', error);
    throw error;
  }
};

// Hydration tracking
export const logHydrationEvent = async (userId, action, context = '') => {
  try {
    const { data, error } = await supabase
      .from('hydration_events')
      .insert({
        user_id: userId,
        action,
        context,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error logging hydration event:', error);
    throw error;
  }
};
