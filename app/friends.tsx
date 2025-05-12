import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  FlatList
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSupabase } from '../src/lib/supabase/SupabaseProvider';
import { 
  searchUsers, 
  sendFriendRequest, 
  getFriendRequests, 
  respondToFriendRequest, 
  getFriends 
} from '../src/lib/supabase/supabaseClient';
import { ArrowLeft, Search, UserPlus, Check, X, Users } from 'lucide-react-native';

export default function FriendsScreen() {
  const { currentUser, refreshUser, isOnline } = useSupabase();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'search'

  // Load friend data when component mounts
  useEffect(() => {
    loadFriendData();
  }, [currentUser]);

  const loadFriendData = async () => {
    setIsLoading(true);
    try {
      // Load pending friend requests
      const requests = await getFriendRequests('pending');
      // Filter to only show requests received by the current user
      const receivedRequests = requests.filter((req: any) => 
        req.receiver && req.receiver.id === currentUser?.id
      );
      setPendingRequests(receivedRequests);
      
      // Load friends
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friend data:', error);
      Alert.alert('Error', 'Failed to load friend data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 3) {
      Alert.alert('Error', 'Please enter at least 3 characters to search');
      return;
    }
    
    setIsSearching(true);
    try {
      const result = await searchUsers(searchQuery);
      if (result.success) {
        setSearchResults(result.data);
        setActiveTab('search');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (username: string) => {
    try {
      const result = await sendFriendRequest(username);
      if (result.success) {
        Alert.alert('Success', result.message);
        // Refresh search results to update UI
        handleSearch();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    }
  };

  const handleRespondToRequest = async (requestId: string, accept: boolean) => {
    try {
      const result = await respondToFriendRequest(requestId, accept);
      if (result.success) {
        Alert.alert('Success', result.message);
        // Refresh data
        loadFriendData();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
      Alert.alert('Error', 'Failed to respond to friend request. Please try again.');
    }
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No users found</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {item.username.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.name}>
                  {item.first_name || ''} {item.last_name || ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSendRequest(item.username)}
            >
              <UserPlus size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />
    );
  };

  const renderPendingRequests = () => {
    if (pendingRequests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No pending friend requests</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={pendingRequests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {item.sender?.username?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.username}>{item.sender?.username || 'Unknown'}</Text>
                <Text style={styles.name}>
                  {item.sender?.first_name || ''} {item.sender?.last_name || ''}
                </Text>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleRespondToRequest(item.id, true)}
              >
                <Check size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRespondToRequest(item.id, false)}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    );
  };

  const renderFriends = () => {
    if (friends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No friends yet</Text>
          <Text style={styles.emptyStateSubtext}>Search for users to add friends</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {item.username?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.username}>{item.username || 'Unknown'}</Text>
                <Text style={styles.name}>
                  {item.first_name || ''} {item.last_name || ''}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ 
        headerShown: false,
      }} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for users by username"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Search size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'friends' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'friends' && styles.activeTabButtonText
          ]}>
            Friends
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tabButton, 
            activeTab === 'requests' && styles.activeTabButton
          ]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[
            styles.tabButtonText,
            activeTab === 'requests' && styles.activeTabButtonText
          ]}>
            Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </Text>
        </TouchableOpacity>
        
        {searchResults.length > 0 && (
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'search' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('search')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'search' && styles.activeTabButtonText
            ]}>
              Results
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'friends' && renderFriends()}
            {activeTab === 'requests' && renderPendingRequests()}
            {activeTab === 'search' && renderSearchResults()}
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: '#1a1a1a',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1a1a1a',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeTabButton: {
    backgroundColor: '#3498db',
  },
  tabButtonText: {
    color: '#ccc',
    fontWeight: 'bold',
  },
  activeTabButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  name: {
    color: '#ccc',
    fontSize: 14,
  },
  actionButton: {
    backgroundColor: '#3498db',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: '#27ae60',
    marginRight: 10,
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
});
