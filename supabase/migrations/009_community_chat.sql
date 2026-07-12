-- Community Chat: real-time messaging table, RLS policies, and Realtime

-- 1. Create the messages table
CREATE TABLE IF NOT EXISTS community_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index for chronological queries
CREATE INDEX idx_community_messages_created_at ON community_messages (created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Any authenticated user can read all messages
CREATE POLICY "community_messages_select"
  ON community_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert messages as themselves
CREATE POLICY "community_messages_insert"
  ON community_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own messages
CREATE POLICY "community_messages_update"
  ON community_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own messages
CREATE POLICY "community_messages_delete"
  ON community_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Enable Realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE community_messages;
