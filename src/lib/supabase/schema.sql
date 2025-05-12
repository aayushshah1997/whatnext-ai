-- Users table for profile information
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT
);

-- Chat messages table for conversation history
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_user_message BOOLEAN DEFAULT TRUE
);

-- Drink quiz results table for drink recommendations
CREATE TABLE IF NOT EXISTS drink_quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  drink_name TEXT NOT NULL,
  drink_type TEXT NOT NULL,
  answers JSONB
);

-- Game sessions table for game scores
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  metadata JSONB
);

-- App sessions table for usage tracking
CREATE TABLE IF NOT EXISTS app_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  features_used TEXT[]
);

-- Hydration events table for hydration tracking
CREATE TABLE IF NOT EXISTS hydration_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL,
  drink_type TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS drink_quiz_results_user_id_idx ON drink_quiz_results(user_id);
CREATE INDEX IF NOT EXISTS game_sessions_user_id_idx ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS game_sessions_game_name_idx ON game_sessions(game_name);
CREATE INDEX IF NOT EXISTS app_sessions_user_id_idx ON app_sessions(user_id);
CREATE INDEX IF NOT EXISTS hydration_events_user_id_idx ON hydration_events(user_id);
CREATE INDEX IF NOT EXISTS hydration_events_created_at_idx ON hydration_events(created_at);

-- Create view for Sloppy Birds leaderboard
CREATE OR REPLACE VIEW sloppy_birds_leaderboard AS
SELECT 
  g.id,
  g.created_at,
  g.score,
  u.username,
  u.id as user_id
FROM 
  game_sessions g
JOIN 
  users u ON g.user_id = u.id
WHERE 
  g.game_name = 'sloppy_birds'
ORDER BY 
  g.score DESC;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE drink_quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_events ENABLE ROW LEVEL SECURITY;

-- Create policies for secure access
-- Users can only access their own data
CREATE POLICY users_policy ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY chat_messages_policy ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY drink_quiz_results_policy ON drink_quiz_results
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY game_sessions_policy ON game_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY app_sessions_policy ON app_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY hydration_events_policy ON hydration_events
  FOR ALL USING (auth.uid() = user_id);

-- Allow reading leaderboard data for all authenticated users
CREATE POLICY game_sessions_leaderboard_policy ON game_sessions
  FOR SELECT USING (true);
