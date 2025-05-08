-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create drink_quiz_results table
CREATE TABLE IF NOT EXISTS public.drink_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  quiz_params JSONB,
  ai_result JSONB,
  vibe_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_sessions table
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  game_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create app_sessions table
CREATE TABLE IF NOT EXISTS public.app_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hydration_events table
CREATE TABLE IF NOT EXISTS public.hydration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create friends table
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  addressee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a view for Sloppy Birds leaderboard
DROP VIEW IF EXISTS public.sloppy_bird_leaderboard;

CREATE OR REPLACE VIEW public.sloppy_bird_leaderboard WITH (security_invoker = on) AS
SELECT 
  u.username,
  MAX(gs.score) as top_score
FROM 
  game_sessions gs
JOIN 
  users u ON gs.user_id = u.id
WHERE 
  gs.game_name = 'Sloppy Birds'
GROUP BY 
  u.username
ORDER BY 
  top_score DESC;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_drink_quiz_results_user_id ON public.drink_quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_name ON public.game_sessions(game_name);
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON public.app_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_hydration_events_user_id ON public.hydration_events(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_requester_id ON public.friends(requester_id);
CREATE INDEX IF NOT EXISTS idx_friends_addressee_id ON public.friends(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON public.friends(status);

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drink_quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (since we're using anon key)
CREATE POLICY "Allow anonymous read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access to users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access to users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow anonymous access to chat_messages" ON public.chat_messages FOR ALL USING (true);
CREATE POLICY "Allow anonymous access to drink_quiz_results" ON public.drink_quiz_results FOR ALL USING (true);
CREATE POLICY "Allow anonymous access to game_sessions" ON public.game_sessions FOR ALL USING (true);
CREATE POLICY "Allow anonymous access to app_sessions" ON public.app_sessions FOR ALL USING (true);
CREATE POLICY "Allow anonymous access to hydration_events" ON public.hydration_events FOR ALL USING (true);
CREATE POLICY "Allow anonymous access to friends" ON public.friends FOR ALL USING (true);
