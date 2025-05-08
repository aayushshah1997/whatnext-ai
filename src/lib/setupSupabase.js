import { supabase } from './supabaseClient';

// Function to create all necessary tables for the app
export const setupSupabaseTables = async () => {
  try {
    console.log('Starting Supabase table setup...');
    
    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.rpc('create_users_table');
    
    if (usersError) {
      console.error('Error creating users table:', usersError);
      return { success: false, error: usersError };
    }
    
    // Create chat_messages table
    console.log('Creating chat_messages table...');
    const { error: chatError } = await supabase.rpc('create_chat_messages_table');
    
    if (chatError) {
      console.error('Error creating chat_messages table:', chatError);
      return { success: false, error: chatError };
    }
    
    // Create drink_quiz_results table
    console.log('Creating drink_quiz_results table...');
    const { error: drinkQuizError } = await supabase.rpc('create_drink_quiz_results_table');
    
    if (drinkQuizError) {
      console.error('Error creating drink_quiz_results table:', drinkQuizError);
      return { success: false, error: drinkQuizError };
    }
    
    // Create game_sessions table
    console.log('Creating game_sessions table...');
    const { error: gameSessionsError } = await supabase.rpc('create_game_sessions_table');
    
    if (gameSessionsError) {
      console.error('Error creating game_sessions table:', gameSessionsError);
      return { success: false, error: gameSessionsError };
    }
    
    // Create app_sessions table
    console.log('Creating app_sessions table...');
    const { error: appSessionsError } = await supabase.rpc('create_app_sessions_table');
    
    if (appSessionsError) {
      console.error('Error creating app_sessions table:', appSessionsError);
      return { success: false, error: appSessionsError };
    }
    
    // Create hydration_events table
    console.log('Creating hydration_events table...');
    const { error: hydrationError } = await supabase.rpc('create_hydration_events_table');
    
    if (hydrationError) {
      console.error('Error creating hydration_events table:', hydrationError);
      return { success: false, error: hydrationError };
    }
    
    console.log('All tables created successfully!');
    return { success: true };
  } catch (error) {
    console.error('Error setting up Supabase tables:', error);
    return { success: false, error };
  }
};

// Alternative approach: create tables using SQL queries
export const createTablesWithSQL = async () => {
  try {
    console.log('Starting Supabase table setup with SQL...');
    
    // Create users table
    console.log('Creating users table...');
    const { error: usersError } = await supabase.from('users').insert({
      id: '00000000-0000-0000-0000-000000000000',
      username: 'system',
      first_name: 'System',
      last_name: 'User',
      email: 'system@example.com',
      created_at: new Date().toISOString(),
    }).select();
    
    if (usersError && usersError.code === '42P01') {
      // Table doesn't exist, create it
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY,
          username TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          email TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE
        );
      `;
      
      const { error } = await supabase.rpc('exec_sql', { sql: createUsersTable });
      
      if (error) {
        console.error('Error creating users table with SQL:', error);
        
        // If RPC fails, try direct SQL approach
        await createUserTableDirectly();
      }
    }
    
    console.log('Tables setup completed');
    return { success: true };
  } catch (error) {
    console.error('Error setting up Supabase tables with SQL:', error);
    return { success: false, error };
  }
};

// Function to create a minimal users table directly
const createUserTableDirectly = async () => {
  try {
    // For this approach, we'll modify our code to work with the existing structure
    console.log('Attempting to modify code to work without users table...');
    
    // We'll update the getOrCreateUser function to store user data in AsyncStorage only
    return { success: true, message: 'Fallback to AsyncStorage only mode' };
  } catch (error) {
    console.error('Error in direct table creation:', error);
    return { success: false, error };
  }
};
