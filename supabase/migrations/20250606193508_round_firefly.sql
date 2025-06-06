/*
  # Create token usage tracking table

  1. New Tables
    - `token_usage`
      - `id` (uuid, primary key, auto-generated)
      - `user_id` (uuid, required) – references auth.users.id
      - `tokens_used` (integer, required)
      - `prompt` (text, optional)
      - `created_at` (timestamp, default: now())

  2. Security
    - Enable RLS on `token_usage` table
    - Add policy for users to access only their own token usage data

  3. Changes
    - Users can insert and select their own token usage records
    - Tracks token consumption per user for usage limits
*/

CREATE TABLE IF NOT EXISTS token_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_used integer NOT NULL DEFAULT 0,
  prompt text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own token usage"
  ON token_usage FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_token_usage_user_id ON token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage(created_at);