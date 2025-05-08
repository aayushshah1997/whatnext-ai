import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, UserPlus, Users } from 'lucide-react-native';
import { getOrCreateUser, getPendingFriendRequests } from '../../src/lib/supabaseClient';
import ScreenLayout from '../../components/ScreenLayout';

export default function FriendsHomeScreen() {
  const router = useRouter();
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user and fetch pending requests count on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await getOrCreateUser();
        if (user && user.id) {
          setCurrentUserId(user.id);
          fetchPendingRequestsCount(user.id);
        }
      } catch (error) {
        console.error('Error initializing:', error);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Fetch pending requests count
  const fetchPendingRequestsCount = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await getPendingFriendRequests(userId);
      
      if (!error && data) {
        setPendingRequestsCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const navigateToSearch = () => router.push('/friends/search');
  const navigateToRequests = () => router.push('/friends/requests');
  const navigateToFriendsList = () => router.push('/friends/list');

  return (
    <ScreenLayout title="Friends" showBackButton>
      <View style={styles.container}>
        <Text style={styles.subtitle}>
          Connect with friends to play games and compete together
        </Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={navigateToSearch}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#3b82f6' }]}>
              <Search size={24} color="#fff" />
            </View>
            <Text style={styles.menuItemText}>Search Users</Text>
            <Text style={styles.menuItemDescription}>
              Find and add new friends
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={navigateToRequests}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#f59e0b' }]}>
              <UserPlus size={24} color="#fff" />
            </View>
            <Text style={styles.menuItemText}>Friend Requests</Text>
            <View style={styles.menuItemRow}>
              <Text style={styles.menuItemDescription}>
                Manage incoming requests
              </Text>
              {loading ? (
                <ActivityIndicator size="small" color="#f59e0b" />
              ) : pendingRequestsCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingRequestsCount}</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={navigateToFriendsList}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#22c55e' }]}>
              <Users size={24} color="#fff" />
            </View>
            <Text style={styles.menuItemText}>My Friends</Text>
            <Text style={styles.menuItemDescription}>
              View your friend list
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  menuContainer: {
    marginTop: 16,
  },
  menuItem: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemDescription: {
    color: '#aaa',
    fontSize: 14,
  },
  badge: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
