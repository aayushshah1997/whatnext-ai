import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CreateFriendsTableScreen() {
  const router = useRouter();
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const clearLogs = () => {
    setResults([]);
  };

  const createFriendsTable = async () => {
    setLoading(true);
    clearLogs();
    try {
      addLog('Creating friend_requests table...');
      
      // SQL script to create the friend_requests table
      const createTableSQL = `
        -- Create a friends table to store friend relationships
        CREATE TABLE IF NOT EXISTS friend_requests (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          sender_id UUID NOT NULL REFERENCES users(id),
          receiver_id UUID NOT NULL REFERENCES users(id),
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(sender_id, receiver_id)
        );

        -- Create indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);
        CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
        CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON friend_requests(status);

        -- Create a view to easily get all friends (accepted requests)
        CREATE OR REPLACE VIEW user_friends AS
        SELECT 
          fr.id,
          fr.sender_id AS user_id,
          fr.receiver_id AS friend_id,
          fr.created_at,
          fr.updated_at
        FROM friend_requests fr
        WHERE fr.status = 'accepted'
        UNION
        SELECT 
          fr.id,
          fr.receiver_id AS user_id,
          fr.sender_id AS friend_id,
          fr.created_at,
          fr.updated_at
        FROM friend_requests fr
        WHERE fr.status = 'accepted';

        -- Add RLS policies
        ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

        -- Allow users to see their own friend requests (sent or received)
        CREATE POLICY friend_requests_select_policy ON friend_requests 
          FOR SELECT USING (
            auth.uid() = sender_id OR 
            auth.uid() = receiver_id
          );

        -- Allow users to create friend requests
        CREATE POLICY friend_requests_insert_policy ON friend_requests 
          FOR INSERT WITH CHECK (
            auth.uid() = sender_id
          );

        -- Allow users to update friend requests they've received
        CREATE POLICY friend_requests_update_policy ON friend_requests 
          FOR UPDATE USING (
            auth.uid() = receiver_id
          );
      `;
      
      // Execute the SQL script
      const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (error) {
        addLog(`❌ Error creating table: ${error.message}`);
        
        // Try an alternative approach if the RPC method doesn't work
        addLog('\nTrying alternative approach...');
        
        // Split the SQL into separate statements
        const statements = createTableSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        let success = true;
        
        for (let i = 0; i < statements.length; i++) {
          const stmt = statements[i];
          addLog(`Executing statement ${i+1}/${statements.length}...`);
          
          const { error } = await supabase.rpc('exec_sql', { sql: stmt });
          
          if (error) {
            addLog(`❌ Error with statement ${i+1}: ${error.message}`);
            success = false;
            break;
          }
        }
        
        if (success) {
          addLog('✅ Table created successfully using alternative approach!');
        }
      } else {
        addLog('✅ Friend requests table created successfully!');
      }
      
      // Verify the table was created
      const { data, error: verifyError } = await supabase
        .from('friend_requests')
        .select('*')
        .limit(1);
      
      if (verifyError) {
        addLog(`❌ Verification failed: ${verifyError.message}`);
      } else {
        addLog('✅ Table verification successful!');
      }
      
    } catch (error) {
      addLog(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const fixFriendRequestsQuery = async () => {
    setLoading(true);
    clearLogs();
    try {
      addLog('Fixing friend requests query...');
      
      // Update the getFriendRequests function to use a simpler query
      addLog('Testing a simpler query without foreign key joins...');
      
      const currentUser = await AsyncStorage.getItem('user_id');
      if (!currentUser) {
        addLog('❌ No user ID found in AsyncStorage');
        return;
      }
      
      addLog(`Using user ID: ${currentUser}`);
      
      // Try a simpler query
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`sender_id.eq.${currentUser},receiver_id.eq.${currentUser}`)
        .limit(10);
      
      if (error) {
        addLog(`❌ Query error: ${error.message}`);
      } else {
        addLog('✅ Query successful!');
        addLog(`Found ${data.length} friend requests`);
        if (data.length > 0) {
          addLog(JSON.stringify(data[0], null, 2));
        }
      }
      
    } catch (error) {
      addLog(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Create Friends Table',
        headerShown: true,
      }} />
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={createFriendsTable}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Create Friends Table</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={fixFriendRequestsQuery}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Simple Query</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.backButton]} 
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        {loading && <Text style={styles.loadingText}>Loading...</Text>}
        {results.map((result, index) => (
          <Text key={index} style={styles.resultText}>{result}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#ff6b6b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#777',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
  },
  loadingText: {
    color: '#ffcc00',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 4,
  },
});
