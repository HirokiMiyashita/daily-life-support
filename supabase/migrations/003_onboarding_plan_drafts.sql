CREATE TABLE IF NOT EXISTS onboarding_plan_drafts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

ALTER TABLE onboarding_plan_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own onboarding drafts" ON onboarding_plan_drafts
  FOR ALL USING (auth.uid() = user_id);
