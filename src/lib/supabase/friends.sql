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
