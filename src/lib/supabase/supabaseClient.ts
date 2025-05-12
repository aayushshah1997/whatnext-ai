import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Custom UUID generator for React Native (RFC4122 version 4 compliant)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Initialize Supabase with environment variables
// Hardcoded values from .env file for development
const supabaseUrl = 'https://wzpkeknpyyctsgqflrhs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6cGtla25weXljdHNncWZscmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTM0NzEsImV4cCI6MjA2MDY2OTQ3MX0.9DTPhYjRY1kXMSQtxOScfCU6zj0lKNR8ZeYpWL_gLts';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Test Supabase connection
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase URL or Anon Key is missing');
      return { 
        success: false, 
        message: 'Supabase configuration missing. Check your environment variables.' 
      };
    }

    // Simple query to test connection
    const { data, error } = await supabase.from('users').select('count').single();
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      
      // Check if the error is related to missing tables
      if (error.code === '42P01') { // PostgreSQL code for undefined_table
        return { 
          success: false, 
          message: 'Database tables not found. Using AsyncStorage fallback.' 
        };
      }
      
      return { 
        success: false, 
        message: `Connection error: ${error.message}` 
      };
    }
    
    return { 
      success: true, 
      message: 'Successfully connected to Supabase' 
    };
  } catch (err) {
    console.error('Unexpected error testing Supabase connection:', err);
    return { 
      success: false, 
      message: 'Unexpected error occurred while testing connection' 
    };
  }
};

// User Management Functions
export const getOrCreateUser = async (userData: {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
} = {}) => {
  try {
    // Step 1: Try loading cached user ID
    const storedId = await AsyncStorage.getItem('user_id');
    console.log('🔍 Loaded user_id from storage:', storedId);
    
    let userId = storedId;
    if (userId) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (data && !error) {
        console.log('✅ Returning cached user:', data);
        
        // Update user data if provided and not empty
        if (Object.keys(userData).length > 0) {
          // Only update fields that are provided and not empty
          const updateData: Record<string, string> = {};
          if (userData.first_name) updateData['first_name'] = userData.first_name;
          if (userData.last_name) updateData['last_name'] = userData.last_name;
          if (userData.email) updateData['email'] = userData.email;
          if (userData.username) updateData['username'] = userData.username;
          
          if (Object.keys(updateData).length > 0) {
            const { data: updatedUser, error: updateError } = await supabase
              .from('users')
              .update(updateData)
              .eq('id', userId)
              .select()
              .single();
              
            if (!updateError && updatedUser) {
              console.log('✅ User profile updated:', updatedUser.id);
              return updatedUser;
            }
          }
        }
        
        return data;
      } else {
        console.warn('⚠️ User ID found in storage but not in Supabase, re-creating...');
      }
    }

    // Step 2: Create new user
    const newUserId = generateUUID();
    const username = userData.username || `user_${Math.random().toString(36).substring(2, 6)}`;

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          id: newUserId,
          username,
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create user:', createError.message);
      throw createError;
    }

    await AsyncStorage.setItem('user_id', newUserId);
    console.log('🆕 New user created and saved locally:', newUserId);

    return newUser;
  } catch (err) {
    console.error('❗ Unexpected error in getOrCreateUser:', err);
    
    // Last resort: try to get user from AsyncStorage if we have it
    const storedUserData = await AsyncStorage.getItem('user_profile');
    if (storedUserData) {
      try {
        const user = JSON.parse(storedUserData);
        if (user && user.id) {
          console.log('⚠️ Using cached user profile as fallback:', user.id);
          return user;
        }
      } catch (parseError) {
        console.error('Failed to parse stored user data:', parseError);
      }
    }
    
    throw err;
  }
};

/**
 * Update user profile with automatic user ID handling
 * This function uses the improved getOrCreateUser function to ensure consistent user identity
 */
export const updateProfile = async (userData: {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
}) => {
  try {
    // Get or create user using the improved function that ensures one user per device
    const user = await getOrCreateUser();
    
    if (!user || !user.id) {
      console.warn('⚠️ No user available to update profile');
      return null;
    }
    
    // Use the user ID from getOrCreateUser to update the profile
    return await updateUserProfile(user.id, userData);
  } catch (error) {
    console.error('❌ Error updating profile with automatic user ID:', error);
    throw error;
  }
};

// Original update user profile function for backward compatibility
export const updateUserProfile = async (userId: string, userData: {
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
}) => {
  try {
    // Check if we have a valid UUID format
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
    // If not a valid UUID, try to get the user by username or fallback to AsyncStorage
    if (!isValidUUID) {
      console.log('Non-UUID user ID detected, using AsyncStorage fallback');
      // Fallback to AsyncStorage
      const storedUserData = await AsyncStorage.getItem('user_profile');
      if (storedUserData) {
        const currentUser = JSON.parse(storedUserData);
        const updatedUser = { ...currentUser, ...userData };
        await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return null;
    }
    
    // First check if the user exists in the database
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    // If user doesn't exist, create it first
    if (checkError || !existingUser) {
      console.log('🔄 User not found in database, creating new user with ID:', userId);
      
      // Generate a username if not provided
      if (!userData.username) {
        userData.username = `user_${Math.random().toString(36).substring(2, 6)}`;
      }
      
      // Create the user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ id: userId, ...userData }])
        .select()
        .single();
        
      if (createError) {
        console.error('Error creating user during update:', createError);
        // Fallback to AsyncStorage
        const storedUserData = await AsyncStorage.getItem('user_profile');
        if (storedUserData) {
          const currentUser = JSON.parse(storedUserData);
          const updatedUser = { ...currentUser, ...userData };
          await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
          return updatedUser;
        }
        throw createError;
      }
      
      // Update in AsyncStorage for offline access
      await AsyncStorage.setItem('user_profile', JSON.stringify(newUser));
      return newUser;
    }
    
    // If user exists, proceed with update
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      
      // Update in AsyncStorage as fallback
      const storedUserData = await AsyncStorage.getItem('user_profile');
      if (storedUserData) {
        const currentUser = JSON.parse(storedUserData);
        const updatedUser = { ...currentUser, ...userData };
        await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
        return updatedUser;
      }
      throw error;
    }

    // Update in AsyncStorage for offline access
    await AsyncStorage.setItem('user_profile', JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Unexpected error in updateUserProfile:', error);
    
    // Fallback to AsyncStorage
    const storedUserData = await AsyncStorage.getItem('user_profile');
    if (storedUserData) {
      const currentUser = JSON.parse(storedUserData);
      const updatedUser = { ...currentUser, ...userData };
      await AsyncStorage.setItem('user_profile', JSON.stringify(updatedUser));
      return updatedUser;
    }
    throw error;
  }
};

// Chat Functions
/**
 * Log a chat message with automatic user ID handling
 * This function uses the improved getOrCreateUser function to ensure consistent user identity
 */
export const saveMessage = async (content: string, isUserMessage: boolean = true) => {
  try {
    // Get or create user using the improved function that ensures one user per device
    const user = await getOrCreateUser();
    
    if (!user || !user.id) {
      console.warn('⚠️ No user available to save chat message');
      return null;
    }
    
    // Use the logChat function with the consistent user ID
    return await logChat({
      user_id: user.id,
      content,
      is_user_message: isUserMessage
    });
  } catch (error) {
    console.error('❌ Error saving chat message:', error);
    return null;
  }
};

/**
 * Original logChat function for backward compatibility
 */
export const logChat = async (message: {
  user_id: string;
  content: string;
  is_user_message: boolean;
}) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([
        {
          ...message,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error logging chat message:', error);
      
      // Store in AsyncStorage as fallback
      const storedMessages = await AsyncStorage.getItem('chat_messages');
      const messages = storedMessages ? JSON.parse(storedMessages) : [];
      const newMessage = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        ...message
      };
      messages.push(newMessage);
      await AsyncStorage.setItem('chat_messages', JSON.stringify(messages));
      return newMessage;
    }

    // Also store in AsyncStorage for offline access
    const storedMessages = await AsyncStorage.getItem('chat_messages');
    const messages = storedMessages ? JSON.parse(storedMessages) : [];
    messages.push(data);
    await AsyncStorage.setItem('chat_messages', JSON.stringify(messages));
    
    return data;
  } catch (error) {
    console.error('Unexpected error in logChat:', error);
    
    // Fallback to AsyncStorage
    const storedMessages = await AsyncStorage.getItem('chat_messages');
    const messages = storedMessages ? JSON.parse(storedMessages) : [];
    const newMessage = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      ...message
    };
    messages.push(newMessage);
    await AsyncStorage.setItem('chat_messages', JSON.stringify(messages));
    return newMessage;
  }
};

export const getChatHistory = async (userId: string, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching chat history:', error);
      
      // Get from AsyncStorage as fallback
      const storedMessages = await AsyncStorage.getItem('chat_messages');
      if (storedMessages) {
        const messages = JSON.parse(storedMessages);
        return messages
          .filter((msg: any) => msg.user_id === userId)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);
      }
      return [];
    }

    // Store in AsyncStorage for offline access
    await AsyncStorage.setItem('chat_messages', JSON.stringify(data));
    
    return data.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Unexpected error in getChatHistory:', error);
    
    // Fallback to AsyncStorage
    const storedMessages = await AsyncStorage.getItem('chat_messages');
    if (storedMessages) {
      const messages = JSON.parse(storedMessages);
      return messages
        .filter((msg: any) => msg.user_id === userId)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit)
        .reverse();
    }
    return [];
  }
};

// Game Functions
export const saveGameScore = async (gameData: {
  user_id: string;
  game_name: string;
  score: number;
  metadata?: any;
}) => {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert([
        {
          ...gameData,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving game score:', error);
      
      // Store in AsyncStorage as fallback
      const storedScores = await AsyncStorage.getItem('game_scores');
      const scores = storedScores ? JSON.parse(storedScores) : [];
      const newScore = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        ...gameData
      };
      scores.push(newScore);
      await AsyncStorage.setItem('game_scores', JSON.stringify(scores));
      return newScore;
    }

    // Also store in AsyncStorage for offline access
    const storedScores = await AsyncStorage.getItem('game_scores');
    const scores = storedScores ? JSON.parse(storedScores) : [];
    scores.push(data);
    await AsyncStorage.setItem('game_scores', JSON.stringify(scores));
    
    return data;
  } catch (error) {
    console.error('Unexpected error in saveGameScore:', error);
    
    // Fallback to AsyncStorage
    const storedScores = await AsyncStorage.getItem('game_scores');
    const scores = storedScores ? JSON.parse(storedScores) : [];
    const newScore = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      ...gameData
    };
    scores.push(newScore);
    await AsyncStorage.setItem('game_scores', JSON.stringify(scores));
    return newScore;
  }
};

export const getGameLeaderboard = async (gameName: string, limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*, users(username)')
      .eq('game_name', gameName)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching game leaderboard:', error);
      
      // Get from AsyncStorage as fallback
      const storedScores = await AsyncStorage.getItem('game_scores');
      if (storedScores) {
        const scores = JSON.parse(storedScores);
        // For AsyncStorage fallback, we don't have user data joined
        // so we'll need to get usernames separately
        const storedUsers = await AsyncStorage.getItem('user_profile');
        const users = storedUsers ? JSON.parse(storedUsers) : {};
        
        return scores
          .filter((score: any) => score.game_name === gameName)
          .sort((a: any, b: any) => b.score - a.score)
          .slice(0, limit)
          .map((score: any) => ({
            ...score,
            users: { username: users.id === score.user_id ? users.username : 'Unknown' }
          }));
      }
      return [];
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getGameLeaderboard:', error);
    
    // Fallback to AsyncStorage
    const storedScores = await AsyncStorage.getItem('game_scores');
    if (storedScores) {
      const scores = JSON.parse(storedScores);
      return scores
        .filter((score: any) => score.game_name === gameName)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, limit);
    }
    return [];
  }
};

// Drink Quiz Functions
export const saveDrinkQuizResult = async (quizData: {
  user_id: string;
  drink_name: string;
  drink_type: string;
  answers: any;
}) => {
  try {
    // Map the data to match the database schema
    const { data, error } = await supabase
      .from('drink_quiz_results')
      .insert([
        {
          user_id: quizData.user_id,
          quiz_params: { // Store answers and other params in quiz_params JSONB field
            drink_name: quizData.drink_name,
            drink_type: quizData.drink_type,
            answers: quizData.answers
          },
          ai_result: null, // Will be populated later if needed
          vibe_score: 0, // Default value
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving drink quiz result:', error);
      
      // Store in AsyncStorage as fallback
      const storedResults = await AsyncStorage.getItem('drink_quiz_results');
      const results = storedResults ? JSON.parse(storedResults) : [];
      const newResult = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        ...quizData
      };
      results.push(newResult);
      await AsyncStorage.setItem('drink_quiz_results', JSON.stringify(results));
      return newResult;
    }

    // Also store in AsyncStorage for offline access
    const storedResults = await AsyncStorage.getItem('drink_quiz_results');
    const results = storedResults ? JSON.parse(storedResults) : [];
    results.push(data);
    await AsyncStorage.setItem('drink_quiz_results', JSON.stringify(results));
    
    return data;
  } catch (error) {
    console.error('Unexpected error in saveDrinkQuizResult:', error);
    
    // Fallback to AsyncStorage
    const storedResults = await AsyncStorage.getItem('drink_quiz_results');
    const results = storedResults ? JSON.parse(storedResults) : [];
    const newResult = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      ...quizData
    };
    results.push(newResult);
    await AsyncStorage.setItem('drink_quiz_results', JSON.stringify(results));
    return newResult;
  }
};

export const getUserDrinkHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('drink_quiz_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user drink history:', error);
      
      // Get from AsyncStorage as fallback
      const storedResults = await AsyncStorage.getItem('drink_quiz_results');
      if (storedResults) {
        const results = JSON.parse(storedResults);
        return results
          .filter((result: any) => result.user_id === userId)
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return [];
    }

    // Store in AsyncStorage for offline access
    await AsyncStorage.setItem('drink_quiz_results', JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('Unexpected error in getUserDrinkHistory:', error);
    
    // Fallback to AsyncStorage
    const storedResults = await AsyncStorage.getItem('drink_quiz_results');
    if (storedResults) {
      const results = JSON.parse(storedResults);
      return results
        .filter((result: any) => result.user_id === userId)
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return [];
  }
};

// Hydration Tracking Functions
export const logHydrationEvent = async (hydrationData: {
  user_id: string;
  amount_ml: number;
  drink_type?: string;
}) => {
  try {
    const { data, error } = await supabase
      .from('hydration_events')
      .insert([
        {
          ...hydrationData,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error logging hydration event:', error);
      
      // Store in AsyncStorage as fallback
      const storedEvents = await AsyncStorage.getItem('hydration_events');
      const events = storedEvents ? JSON.parse(storedEvents) : [];
      const newEvent = {
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        ...hydrationData
      };
      events.push(newEvent);
      await AsyncStorage.setItem('hydration_events', JSON.stringify(events));
      return newEvent;
    }

    // Also store in AsyncStorage for offline access
    const storedEvents = await AsyncStorage.getItem('hydration_events');
    const events = storedEvents ? JSON.parse(storedEvents) : [];
    events.push(data);
    await AsyncStorage.setItem('hydration_events', JSON.stringify(events));
    
    return data;
  } catch (error) {
    console.error('Unexpected error in logHydrationEvent:', error);
    
    // Fallback to AsyncStorage
    const storedEvents = await AsyncStorage.getItem('hydration_events');
    const events = storedEvents ? JSON.parse(storedEvents) : [];
    const newEvent = {
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      ...hydrationData
    };
    events.push(newEvent);
    await AsyncStorage.setItem('hydration_events', JSON.stringify(events));
    return newEvent;
  }
};

export const getHydrationHistory = async (userId: string, days = 7) => {
  try {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('hydration_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching hydration history:', error);
      
      // Get from AsyncStorage as fallback
      const storedEvents = await AsyncStorage.getItem('hydration_events');
      if (storedEvents) {
        const events = JSON.parse(storedEvents);
        return events
          .filter((event: any) => {
            const eventDate = new Date(event.created_at);
            return event.user_id === userId && 
                   eventDate >= startDate && 
                   eventDate <= endDate;
          })
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
      return [];
    }

    // Store in AsyncStorage for offline access
    await AsyncStorage.setItem('hydration_events', JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('Unexpected error in getHydrationHistory:', error);
    
    // Fallback to AsyncStorage
    const storedEvents = await AsyncStorage.getItem('hydration_events');
    if (storedEvents) {
      const events = JSON.parse(storedEvents);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      return events
        .filter((event: any) => {
          const eventDate = new Date(event.created_at);
          return event.user_id === userId && 
                 eventDate >= startDate && 
                 eventDate <= endDate;
        })
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return [];
  }
};

// App Session Tracking
export const logAppSession = async (sessionData: {
  user_id: string;
  session_start: string;
  session_end?: string;
  features_used?: string[];
}) => {
  try {
    const { data, error } = await supabase
      .from('app_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      console.error('Error logging app session:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error in logAppSession:', error);
    return null;
  }
};

export const updateAppSession = async (sessionId: string, sessionData: {
  session_end?: string;
  features_used?: string[];
}) => {
  try {
    const { data, error } = await supabase
      .from('app_sessions')
      .update(sessionData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating app session:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error in updateAppSession:', error);
    return null;
  }
};

// Get user's high score for a specific game
export const getUserHighScore = async (userId: string) => {
  try {
    console.log('Fetching high score for user:', userId);
    const { data, error } = await supabase
      .from('game_sessions')
      .select('score')
      .eq('user_id', userId)
      .eq('game_name', 'Sloppy Birds')
      .order('score', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Failed to fetch high score:', error);
      
      // Try to get from AsyncStorage as fallback
      const storedScores = await AsyncStorage.getItem('game_scores');
      if (storedScores) {
        const scores = JSON.parse(storedScores);
        const userScores = scores
          .filter((score: any) => 
            score.user_id === userId && 
            score.game_name === 'Sloppy Birds'
          )
          .sort((a: any, b: any) => b.score - a.score);
        
        return userScores.length > 0 ? userScores[0].score : 0;
      }
      return 0;
    }

    console.log('High score data from Supabase:', data);
    return data.length > 0 ? data[0].score : 0;
  } catch (error) {
    console.error('Unexpected error in getUserHighScore:', error);
    
    // Fallback to AsyncStorage
    try {
      const storedScores = await AsyncStorage.getItem('game_scores');
      if (storedScores) {
        const scores = JSON.parse(storedScores);
        const userScores = scores
          .filter((score: any) => 
            score.user_id === userId && 
            score.game_name === 'Sloppy Birds'
          )
          .sort((a: any, b: any) => b.score - a.score);
        
        return userScores.length > 0 ? userScores[0].score : 0;
      }
    } catch (asyncError) {
      console.error('Error accessing AsyncStorage:', asyncError);
    }
    return 0;
  }
};

// Friend Request Management Functions

// Send a friend request
export const sendFriendRequest = async (receiverUsername: string) => {
  try {
    // First, get the current user
    const currentUser = await getOrCreateUser();
    if (!currentUser) {
      console.error('Cannot send friend request: Current user not found');
      return { success: false, message: 'User not found' };
    }

    // Find the receiver by username
    const { data: receiverData, error: receiverError } = await supabase
      .from('users')
      .select('id')
      .eq('username', receiverUsername)
      .single();

    if (receiverError || !receiverData) {
      console.error('Receiver not found:', receiverError);
      return { success: false, message: 'User not found with that username' };
    }

    // Check if this is the same user
    if (currentUser.id === receiverData.id) {
      return { success: false, message: 'You cannot send a friend request to yourself' };
    }

    // Check if a request already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from('friend_requests')
      .select('id, status, sender_id, receiver_id')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${receiverData.id}),and(sender_id.eq.${receiverData.id},receiver_id.eq.${currentUser.id})`)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing request:', checkError);
      
      // Try AsyncStorage fallback for offline mode
      const storedRequests = await AsyncStorage.getItem('friend_requests');
      if (storedRequests) {
        const requests = JSON.parse(storedRequests);
        const existingRequest = requests.find(
          (req: any) => 
            (req.sender_id === currentUser.id && req.receiver_id === receiverData.id) ||
            (req.sender_id === receiverData.id && req.receiver_id === currentUser.id)
        );
        
        if (existingRequest) {
          if (existingRequest.status === 'accepted') {
            return { success: false, message: 'You are already friends with this user' };
          } else if (existingRequest.status === 'pending' && existingRequest.sender_id === currentUser.id) {
            return { success: false, message: 'Friend request already sent' };
          } else if (existingRequest.status === 'pending' && existingRequest.receiver_id === currentUser.id) {
            return { success: false, message: 'This user already sent you a friend request' };
          }
        }
      }
    } else if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        return { success: false, message: 'You are already friends with this user' };
      } else if (existingRequest.status === 'pending' && existingRequest.sender_id === currentUser.id) {
        return { success: false, message: 'Friend request already sent' };
      } else if (existingRequest.status === 'pending' && existingRequest.receiver_id === currentUser.id) {
        return { success: false, message: 'This user already sent you a friend request' };
      }
    }

    // Send the friend request
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        sender_id: currentUser.id,
        receiver_id: receiverData.id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending friend request:', error);
      
      // Store in AsyncStorage for offline mode
      try {
        const request = {
          id: generateUUID(),
          sender_id: currentUser.id,
          receiver_id: receiverData.id,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          offline: true
        };
        
        const storedRequests = await AsyncStorage.getItem('friend_requests');
        const requests = storedRequests ? JSON.parse(storedRequests) : [];
        requests.push(request);
        await AsyncStorage.setItem('friend_requests', JSON.stringify(requests));
        
        return { success: true, message: 'Friend request sent (offline mode)', data: request };
      } catch (asyncError) {
        console.error('Error storing in AsyncStorage:', asyncError);
        return { success: false, message: 'Failed to send friend request' };
      }
    }

    return { success: true, message: 'Friend request sent successfully', data };
  } catch (error) {
    console.error('Unexpected error in sendFriendRequest:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};

// Get friend requests for current user
export const getFriendRequests = async (status: 'pending' | 'accepted' | 'rejected' | 'all' = 'pending') => {
  try {
    const currentUser = await getOrCreateUser();
    if (!currentUser) {
      console.error('Cannot get friend requests: Current user not found');
      return [];
    }

    // First, check if the friend_requests table exists
    try {
      const { count, error: checkError } = await supabase
        .from('friend_requests')
        .select('*', { count: 'exact', head: true });
        
      if (checkError) {
        console.error('Friend requests table may not exist:', checkError);
        return [];
      }
    } catch (checkErr) {
      console.error('Error checking friend_requests table:', checkErr);
      return [];
    }

    // Use a simpler query without foreign key joins
    let query = supabase
      .from('friend_requests')
      .select('*')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching friend requests:', error);
      
      // Try AsyncStorage fallback
      const storedRequests = await AsyncStorage.getItem('friend_requests');
      if (storedRequests) {
        const requests = JSON.parse(storedRequests);
        return requests.filter((req: any) => 
          (req.sender_id === currentUser.id || req.receiver_id === currentUser.id) &&
          (status === 'all' || req.status === status)
        );
      }
      return [];
    }

    // For each request, fetch the user details separately
    const enrichedRequests = await Promise.all((data || []).map(async (request: any) => {
      // Fetch sender details
      const { data: senderData } = await supabase
        .from('users')
        .select('id, username, first_name, last_name')
        .eq('id', request.sender_id)
        .single();
        
      // Fetch receiver details
      const { data: receiverData } = await supabase
        .from('users')
        .select('id, username, first_name, last_name')
        .eq('id', request.receiver_id)
        .single();
        
      return {
        ...request,
        sender: senderData || { id: request.sender_id },
        receiver: receiverData || { id: request.receiver_id }
      };
    }));

    return enrichedRequests;
  } catch (error) {
    console.error('Unexpected error in getFriendRequests:', error);
    return [];
  }
};

// Get pending friend requests received by current user
export const getPendingFriendRequests = async () => {
  try {
    const currentUser = await getOrCreateUser();
    if (!currentUser) {
      console.error('Cannot get pending requests: Current user not found');
      return [];
    }

    // Check if the friend_requests table exists
    try {
      const { count, error: checkError } = await supabase
        .from('friend_requests')
        .select('*', { count: 'exact', head: true });
        
      if (checkError) {
        console.error('Friend requests table may not exist:', checkError);
        return [];
      }
    } catch (checkErr) {
      console.error('Error checking friend_requests table:', checkErr);
      return [];
    }

    // Use a simpler query without foreign key joins
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', currentUser.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching pending friend requests:', error);
      
      // Try AsyncStorage fallback
      const storedRequests = await AsyncStorage.getItem('friend_requests');
      if (storedRequests) {
        const requests = JSON.parse(storedRequests);
        return requests.filter((req: any) => 
          req.receiver_id === currentUser.id && req.status === 'pending'
        );
      }
      return [];
    }

    // For each request, fetch the sender details separately
    const enrichedRequests = await Promise.all((data || []).map(async (request: any) => {
      // Fetch sender details
      const { data: senderData } = await supabase
        .from('users')
        .select('id, username, first_name, last_name')
        .eq('id', request.sender_id)
        .single();
        
      return {
        ...request,
        sender: senderData || { id: request.sender_id }
      };
    }));

    return enrichedRequests;
  } catch (error) {
    console.error('Unexpected error in getPendingFriendRequests:', error);
    return [];
  }
};

// Get all friends of current user
export const getFriends = async () => {
  try {
    const currentUser = await getOrCreateUser();
    if (!currentUser) {
      console.error('Cannot get friends: Current user not found');
      return [];
    }

    // Check if the friend_requests table exists
    try {
      const { count, error: checkError } = await supabase
        .from('friend_requests')
        .select('*', { count: 'exact', head: true });
        
      if (checkError) {
        console.error('Friend requests table may not exist:', checkError);
        return [];
      }
    } catch (checkErr) {
      console.error('Error checking friend_requests table:', checkErr);
      return [];
    }

    // Use a simpler query without foreign key joins
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

    if (error) {
      console.error('Error fetching friends:', error);
      
      // Try AsyncStorage fallback
      const storedRequests = await AsyncStorage.getItem('friend_requests');
      if (storedRequests) {
        const requests = JSON.parse(storedRequests);
        return requests.filter((req: any) => 
          (req.sender_id === currentUser.id || req.receiver_id === currentUser.id) && 
          req.status === 'accepted'
        );
      }
      return [];
    }

    // For each accepted friend request, fetch the friend's details
    const friendsList = await Promise.all((data || []).map(async (request: any) => {
      const isSender = request.sender_id === currentUser.id;
      const friendId = isSender ? request.receiver_id : request.sender_id;
      
      // Fetch friend details
      const { data: friendData } = await supabase
        .from('users')
        .select('id, username, first_name, last_name')
        .eq('id', friendId)
        .single();
        
      if (!friendData) {
        return null;
      }
      
      return {
        id: request.id,
        friend_id: friendData.id,
        username: friendData.username,
        first_name: friendData.first_name,
        last_name: friendData.last_name,
        created_at: request.created_at
      };
    }));

    // Filter out any null entries (in case a user was deleted)
    return friendsList.filter(friend => friend !== null);
  } catch (error) {
    console.error('Unexpected error in getFriends:', error);
    return [];
  }
};

// Respond to a friend request
export const respondToFriendRequest = async (requestId: string, accept: boolean) => {
  try {
    const currentUser = await getOrCreateUser();
    if (!currentUser) {
      console.error('Cannot respond to request: Current user not found');
      return { success: false, message: 'User not found' };
    }

    // Update the request status
    const { data, error } = await supabase
      .from('friend_requests')
      .update({ 
        status: accept ? 'accepted' : 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .eq('receiver_id', currentUser.id)
      .select()
      .single();

    if (error) {
      console.error('Error responding to friend request:', error);
      
      // Try AsyncStorage fallback
      const storedRequests = await AsyncStorage.getItem('friend_requests');
      if (storedRequests) {
        const requests = JSON.parse(storedRequests);
        const requestIndex = requests.findIndex(
          (req: any) => req.id === requestId && req.receiver_id === currentUser.id
        );
        
        if (requestIndex >= 0) {
          requests[requestIndex].status = accept ? 'accepted' : 'rejected';
          requests[requestIndex].updated_at = new Date().toISOString();
          await AsyncStorage.setItem('friend_requests', JSON.stringify(requests));
          return { 
            success: true, 
            message: `Friend request ${accept ? 'accepted' : 'rejected'} (offline mode)`,
            data: requests[requestIndex]
          };
        }
        return { success: false, message: 'Friend request not found' };
      }
      return { success: false, message: 'Failed to respond to friend request' };
    }

    return { 
      success: true, 
      message: `Friend request ${accept ? 'accepted' : 'rejected'} successfully`,
      data
    };
  } catch (error) {
    console.error('Unexpected error in respondToFriendRequest:', error);
    return { success: false, message: 'An unexpected error occurred' };
  }
};

// Search for users by username
export const searchUsers = async (query: string) => {
  try {
    if (!query || query.length < 3) {
      return { success: false, message: 'Search query must be at least 3 characters', data: [] };
    }

    const currentUser = await getOrCreateUser();
    if (!currentUser) {
      console.error('Cannot search users: Current user not found');
      return { success: false, message: 'User not found', data: [] };
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, username, first_name, last_name')
      .ilike('username', `%${query}%`)
      .neq('id', currentUser.id)
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      return { success: false, message: 'Failed to search users', data: [] };
    }

    return { success: true, message: 'Users found', data: data || [] };
  } catch (error) {
    console.error('Unexpected error in searchUsers:', error);
    return { success: false, message: 'An unexpected error occurred', data: [] };
  }
};

// Get game leaderboard for accepted friends only
export const getFriendsLeaderboard = async (gameName: string, limit = 10) => {
  try {
    console.log(`Getting friends leaderboard for game: ${gameName}`);
    
    const currentUser = await getOrCreateUser();
    if (!currentUser) {
      console.error('Cannot get friends leaderboard: Current user not found');
      return [];
    }
    console.log(`Current user ID: ${currentUser.id}`);

    // First, get the list of accepted friends
    const friends = await getFriends();
    console.log(`Found ${friends.length} accepted friends:`, friends);
    
    if (!friends || friends.length === 0) {
      console.log('No accepted friends found for leaderboard');
      return [];
    }

    // Extract friend IDs
    const friendIds = friends.map((friend: any) => friend.friend_id);
    console.log('Friend IDs for leaderboard query:', friendIds);
    
    // Add the current user's ID to include their scores too
    const userIdsToQuery = [...friendIds, currentUser.id];
    console.log('All user IDs for leaderboard query:', userIdsToQuery);
    
    // Try both 'sloppy_birds' and 'SloppyBirds' as game names
    // Some games might be stored with different casing or formatting
    const possibleGameNames = [gameName, 'SloppyBirds', 'sloppybirds', 'Sloppy Birds', 'sloppy-birds'];
    
    let leaderboardData: any[] = [];
    
    // Try each possible game name
    for (const name of possibleGameNames) {
      console.log(`Trying game name: ${name}`);
      
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*, users(id, username, first_name, last_name)')
        .eq('game_name', name)
        .in('user_id', userIdsToQuery)
        .order('score', { ascending: false });
      
      if (!error && data && data.length > 0) {
        console.log(`Found ${data.length} scores with game name: ${name}`, data);
        leaderboardData = data;
        break;
      }
    }
    
    // If we found data, process it to get unique users with highest scores
    if (leaderboardData.length > 0) {
      // Create a map to track highest score per user
      const userHighestScores = new Map();
      
      // Process each score
      leaderboardData.forEach(entry => {
        const userId = entry.user_id;
        
        // If we haven't seen this user yet, or if this score is higher than what we've seen
        if (!userHighestScores.has(userId) || entry.score > userHighestScores.get(userId).score) {
          userHighestScores.set(userId, entry);
        }
      });
      
      // Convert map back to array and sort by score
      const uniqueLeaderboard = Array.from(userHighestScores.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      console.log('Unique leaderboard with highest scores per user:', uniqueLeaderboard);
      return uniqueLeaderboard;
    }
    
    // If no data found, try a more general query without game name filter
    console.log('No scores found with specific game names, trying general query');
    const { data: allScores, error: allScoresError } = await supabase
      .from('game_sessions')
      .select('*, users(id, username, first_name, last_name)')
      .in('user_id', userIdsToQuery)
      .order('score', { ascending: false });
    
    if (allScoresError) {
      console.error('Error fetching all game scores:', allScoresError);
    } else if (allScores && allScores.length > 0) {
      console.log('Found some game scores:', allScores);
      // Filter after fetching to find any that might match our game
      const filteredScores = allScores.filter(score => {
        const scoreName = score.game_name?.toLowerCase() || '';
        return possibleGameNames.some(name => scoreName.includes(name.toLowerCase()));
      });
      
      if (filteredScores.length > 0) {
        console.log('Filtered scores that match our game:', filteredScores);
        
        // Create a map to track highest score per user
        const userHighestScores = new Map();
        
        // Process each score
        filteredScores.forEach(entry => {
          const userId = entry.user_id;
          
          // If we haven't seen this user yet, or if this score is higher than what we've seen
          if (!userHighestScores.has(userId) || entry.score > userHighestScores.get(userId).score) {
            userHighestScores.set(userId, entry);
          }
        });
        
        // Convert map back to array and sort by score
        const uniqueLeaderboard = Array.from(userHighestScores.values())
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);
        
        console.log('Unique leaderboard with highest scores per user:', uniqueLeaderboard);
        return uniqueLeaderboard;
      }
    }
    
    // Fallback to AsyncStorage
    console.log('Trying AsyncStorage fallback');
    const storedScores = await AsyncStorage.getItem('game_scores');
    if (storedScores) {
      const scores = JSON.parse(storedScores);
      console.log('AsyncStorage scores:', scores);
      
      const filteredScores = scores
        .filter((score: any) => {
          const scoreName = score.game_name?.toLowerCase() || '';
          return possibleGameNames.some(name => scoreName.includes(name.toLowerCase())) &&
                 userIdsToQuery.includes(score.user_id);
        });

      console.log('Filtered AsyncStorage scores:', filteredScores);
      
      // Create a map to track highest score per user
      const userHighestScores = new Map();
      
      // Process each score
      filteredScores.forEach((entry: any) => {
        const userId = entry.user_id;
        
        // If we haven't seen this user yet, or if this score is higher than what we've seen
        if (!userHighestScores.has(userId) || entry.score > userHighestScores.get(userId).score) {
          userHighestScores.set(userId, entry);
        }
      });
      
      // Convert map back to array and sort by score
      const uniqueLeaderboard = Array.from(userHighestScores.values())
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, limit);
      
      // For AsyncStorage fallback, we need to add user info
      return await Promise.all(uniqueLeaderboard.map(async (score: any) => {
        const friend = friends.find((f: any) => f.friend_id === score.user_id);
        const isCurrentUser = score.user_id === currentUser.id;
        
        return {
          ...score,
          users: { 
            username: isCurrentUser ? currentUser.username : (friend ? friend.username : 'Unknown'),
            first_name: isCurrentUser ? currentUser.first_name : (friend ? friend.first_name : ''),
            last_name: isCurrentUser ? currentUser.last_name : (friend ? friend.last_name : '')
          }
        };
      }));
    }
    
    console.log('No leaderboard data found in any source');
    return [];
  } catch (error) {
    console.error('Unexpected error in getFriendsLeaderboard:', error);
    return [];
  }
};
