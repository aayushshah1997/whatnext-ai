import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, testSupabaseConnection, getOrCreateUser } from './supabaseClient';

type SupabaseContextType = {
  isOnline: boolean;
  isLoading: boolean;
  currentUser: any;
  refreshUser: () => Promise<void>;
  connectionMessage: string;
};

const SupabaseContext = createContext<SupabaseContextType>({
  isOnline: false,
  isLoading: true,
  currentUser: null,
  refreshUser: async () => {},
  connectionMessage: '',
});

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connectionMessage, setConnectionMessage] = useState('');

  const refreshUser = async () => {
    try {
      // Use the improved getOrCreateUser function that ensures one user per device
      const user = await getOrCreateUser();
      
      if (user) {
        // Update the current user state
        setCurrentUser(user);
        
        // Also store in user_profile for backward compatibility
        await AsyncStorage.setItem('user_profile', JSON.stringify(user));
        console.log('✅ User refreshed successfully:', user.id);
      } else {
        console.warn('⚠️ No user returned from getOrCreateUser');
      }
    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        setIsLoading(true);
        
        // Test connection to Supabase
        const { success, message } = await testSupabaseConnection();
        setIsOnline(success);
        setConnectionMessage(message);
        
        // Get user data from AsyncStorage (works in both online and offline modes)
        await refreshUser();
      } catch (error) {
        console.error('Error initializing Supabase:', error);
        setIsOnline(false);
        setConnectionMessage('Failed to connect to backend');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSupabase();
  }, []);

  const value = {
    isOnline,
    isLoading,
    currentUser,
    refreshUser,
    connectionMessage,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export default SupabaseProvider;
