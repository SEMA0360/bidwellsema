/*
# Create AI provider keys table

1. New Tables
- `ai_provider_keys`
  - `provider` (text, primary key) — identifies the AI provider (gemini, groq, openrouter)
  - `api_key` (text, not null) — the secret API key for the provider
  - `created_at` (timestamptz) — when the key was stored
  - `updated_at` (timestamptz) — when the key was last updated

2. Security
- Enable RLS on `ai_provider_keys`.
- NO policies for anon or authenticated roles — only the service role (which bypasses RLS) can read/write this table.
- This ensures the browser-facing anon key can never access the API keys, but edge functions using the service role key can.

3. Important Notes
- This table stores sensitive API keys for third-party AI providers (Gemini, Groq, OpenRouter).
- Edge functions read from this table using the SUPABASE_SERVICE_ROLE_KEY environment variable.
- The anon-key frontend has no access to this table.
*/

CREATE TABLE IF NOT EXISTS ai_provider_keys (
  provider text PRIMARY KEY,
  api_key text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;
