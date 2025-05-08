import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Users } from 'lucide-react-native';
import { getOrCreateUser, getFriendsList } from '../../src/lib/supabaseClient';
import ScreenLayout from '../../components/ScreenLayout';

type Friend = {
  friendshipId: string;
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
};

export default function MyFriendsScreen() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user and fetch friends on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await getOrCreateUser();
        if (user && user.id) {
          setCurrentUserId(user.id);
          fetchFriends(user.id);
        }
      } catch (error) {
        console.error('Error initializing:', error);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Fetch friends list
  const fetchFriends = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await getFriendsList(userId);
      
      if (error) {
        Alert.alert('Error', 'Failed to fetch friends list. Please try again.');
      } else {
        setFriends(data);
      }
    } catch (error) {
      console.error('Error fetching friends list:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Render friend item
  const renderFriendItem = ({ item }: { item: Friend }) => {
    return (
      <View style={styles.friendItem}>
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
          <Text style={styles.timestamp}>
            Friends since {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenLayout title="My Friends" showBackButton>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading friends...</Text>
          </View>
        ) : friends.length > 0 ? (
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.friendshipId}
            contentContainerStyle={styles.friendsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Users size={50} color="#666" />
            <Text style={styles.emptyStateText}>
              You don't have any friends yet
            </Text>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => router.push('/friends/search')}
            >
              <Text style={styles.searchButtonText}>Find Friends</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  friendsList: {
    flexGrow: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 20,
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
  timestamp: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
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
    marginBottom: 24,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
