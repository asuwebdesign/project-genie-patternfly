-- Create chat_threads table
CREATE TABLE IF NOT EXISTS chat_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_threads_user_id ON chat_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_updated_at ON chat_threads(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON chat_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_threads
CREATE POLICY "Users can view their own chat threads" ON chat_threads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat threads" ON chat_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat threads" ON chat_threads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat threads" ON chat_threads
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view messages in their threads" ON chat_messages
  FOR SELECT USING (
    auth.uid() = user_id AND
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their threads" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their threads" ON chat_messages
  FOR UPDATE USING (
    auth.uid() = user_id AND
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their threads" ON chat_messages
  FOR DELETE USING (
    auth.uid() = user_id AND
    thread_id IN (
      SELECT id FROM chat_threads WHERE user_id = auth.uid()
    )
  );

-- Create function to update thread's updated_at timestamp
CREATE OR REPLACE FUNCTION update_thread_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_threads 
  SET updated_at = NOW(), message_count = (
    SELECT COUNT(*) FROM chat_messages WHERE thread_id = NEW.thread_id
  )
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update thread timestamp and message count
CREATE TRIGGER update_thread_on_message
  AFTER INSERT OR DELETE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_thread_updated_at();
