import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type FriendshipStatus = 'pending' | 'accepted' | 'declined' | 'send' | null;

interface FriendshipStatusBadgeProps {
  status: FriendshipStatus;
  isRequester?: boolean;
}

const FriendshipStatusBadge: React.FC<FriendshipStatusBadgeProps> = ({ 
  status, 
  isRequester = false 
}) => {
  if (!status) return null;
  
  let backgroundColor = '#333';
  let textColor = '#fff';
  let label = '';
  
  switch (status) {
    case 'pending':
      backgroundColor = isRequester ? '#f59e0b' : '#3b82f6';
      textColor = '#fff';
      label = isRequester ? 'Request Sent' : 'Pending';
      break;
    case 'accepted':
      backgroundColor = '#22c55e';
      textColor = '#fff';
      label = 'Friends';
      break;
    case 'declined':
      backgroundColor = '#ef4444';
      textColor = '#fff';
      label = 'Declined';
      break;
    case 'send':
      backgroundColor = '#3b82f6';
      textColor = '#fff';
      label = 'Add Friend';
      break;
    default:
      return null;
  }
  
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FriendshipStatusBadge;
