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
import { UserPlus, Check, X } from 'lucide-react-native';
import { getOrCreateUser, getPendingFriendRequests, acceptFriendRequest, declineFriendRequest } from '../../src/lib/supabaseClient';
import ScreenLayout from '../../components/ScreenLayout';

type FriendRequest = {
  id: string;
  created_at: string;
  requester: {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
  };
};

export default function FriendRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user and fetch requests on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await getOrCreateUser();
        if (user && user.id) {
          setCurrentUserId(user.id);
          fetchRequests(user.id);
        }
      } catch (error) {
        console.error('Error initializing:', error);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Fetch friend requests
  const fetchRequests = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await getPendingFriendRequests(userId);
      
      if (error) {
        Alert.alert('Error', 'Failed to fetch friend requests. Please try again.');
      } else {
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle accept friend request
  const handleAccept = async (requestId: string) => {
    setProcessingIds(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const { data, error } = await acceptFriendRequest(requestId);
      
      if (error) {
        Alert.alert('Error', `Failed to accept friend request: ${error.message}`);
      } else {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId));
        Alert.alert('Success', 'Friend request accepted!');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setProcessingIds(prev => ({ ...prev, [requestId]: false }));
    }
  };

  // Handle decline friend request
  const handleDecline = async (requestId: string) => {
    setProcessingIds(prev => ({ ...prev, [requestId]: true }));
    
    try {
      const { data, error } = await declineFriendRequest(requestId);
      
      if (error) {
        Alert.alert('Error', `Failed to decline friend request: ${error.message}`);
      } else {
        // Remove the request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId));
        Alert.alert('Success', 'Friend request declined.');
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setProcessingIds(prev => ({ ...prev, [requestId]: false }));
    }
  };

  // Render request item
  const renderRequestItem = ({ item }: { item: FriendRequest }) => {
    const isProcessing = processingIds[item.id] || false;
    
    return (
      <View style={styles.requestItem}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {item.requester.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.requester.username}</Text>
          {item.requester.first_name && item.requester.last_name && (
            <Text style={styles.name}>
              {item.requester.first_name} {item.requester.last_name}
            </Text>
          )}
          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.actionContainer}>
          {isProcessing ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAccept(item.id)}
              >
                <Check size={20} color="#fff" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleDecline(item.id)}
              >
                <X size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScreenLayout title="Friend Requests" showBackButton>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading friend requests...</Text>
          </View>
        ) : requests.length > 0 ? (
          <FlatList
            data={requests}
            renderItem={renderRequestItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.requestsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <UserPlus size={50} color="#666" />
            <Text style={styles.emptyStateText}>
              You don't have any pending friend requests
            </Text>
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
  requestsList: {
    flexGrow: 1,
  },
  requestItem: {
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
    backgroundColor: '#f59e0b',
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
  actionContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: '#22c55e',
  },
  declineButton: {
    backgroundColor: '#ef4444',
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
