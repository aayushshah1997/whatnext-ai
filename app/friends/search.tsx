import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { User, Search } from 'lucide-react-native';
import { searchUsersByUsername, sendFriendRequest, getOrCreateUser } from '../../src/lib/supabaseClient';
import FriendshipStatusBadge from '../../src/components/FriendshipStatusBadge';
import ScreenLayout from '../../components/ScreenLayout';

type UserResult = {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  friendshipStatus: 'pending' | 'accepted' | 'declined' | null;
  friendshipId: string | null;
  isRequester: boolean;
};

export default function SearchUsersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sendingRequests, setSendingRequests] = useState<Record<string, boolean>>({});

  // Get current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getOrCreateUser();
        if (user && user.id) {
          setCurrentUserId(user.id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentUserId) return;
    
    setLoading(true);
    try {
      const { data, error } = await searchUsersByUsername(searchQuery, currentUserId);
      
      if (error) {
        Alert.alert('Error', 'Failed to search users. Please try again.');
      } else {
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Send friend request
  const handleSendRequest = async (username: string, userId: string) => {
    if (!currentUserId) return;
    
    setSendingRequests(prev => ({ ...prev, [userId]: true }));
    
    try {
      const { data, error, alreadyExists } = await sendFriendRequest(currentUserId, username);
      
      if (error) {
        Alert.alert('Error', `Failed to send friend request: ${error.message}`);
      } else {
        if (alreadyExists) {
          Alert.alert('Info', 'A friend request already exists between you and this user.');
        } else {
          Alert.alert('Success', `Friend request sent to ${username}!`);
          
          // Update the search results to reflect the new status
          setSearchResults(prev => 
            prev.map(user => 
              user.id === userId 
                ? { 
                    ...user, 
                    friendshipStatus: 'pending', 
                    friendshipId: data?.id || null,
                    isRequester: true
                  } 
                : user
            )
          );
        }
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setSendingRequests(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Render user item
  const renderUserItem = ({ item }: { item: UserResult }) => {
    const isSending = sendingRequests[item.id] || false;
    
    return (
      <View style={styles.userItem}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          {item.first_name && item.last_name && (
            <Text style={styles.name}>
              {item.first_name} {item.last_name}
            </Text>
          )}
        </View>
        
        <View style={styles.actionContainer}>
          {item.friendshipStatus ? (
            <FriendshipStatusBadge 
              status={item.friendshipStatus} 
              isRequester={item.isRequester} 
            />
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleSendRequest(item.username, item.id)}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FriendshipStatusBadge status="send" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenLayout title="Search Users" showBackButton>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Search size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
        
        {searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.resultsList}
          />
        ) : (
          <View style={styles.emptyState}>
            {loading ? (
              <ActivityIndicator size="large" color="#3b82f6" />
            ) : searchQuery.trim() ? (
              <>
                <User size={50} color="#666" />
                <Text style={styles.emptyStateText}>No users found</Text>
              </>
            ) : (
              <>
                <Search size={50} color="#666" />
                <Text style={styles.emptyStateText}>
                  Search for users by their username
                </Text>
              </>
            )}
          </View>
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsList: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  name: {
    color: '#aaa',
    fontSize: 14,
  },
  actionContainer: {
    marginLeft: 8,
  },
  addButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});
