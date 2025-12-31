-- EnCode Database Schema
-- This stores REASONING, not facts.
-- No ingredient database. No nutrition data. Only AI interpretations.

-- The analyses table stores AI reasoning outputs
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    judgment TEXT NOT NULL,
    key_factors JSONB NOT NULL,
    tradeoffs TEXT NOT NULL,
    uncertainty TEXT NOT NULL,
    confidence TEXT NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_id_created_at 
ON public.analyses(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own analyses
CREATE POLICY "Users can view own analyses"
ON public.analyses
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can only insert their own analyses
CREATE POLICY "Users can create own analyses"
ON public.analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own analyses
CREATE POLICY "Users can delete own analyses"
ON public.analyses
FOR DELETE
USING (auth.uid() = user_id);

-- Note: No UPDATE policy — analyses are immutable once created
