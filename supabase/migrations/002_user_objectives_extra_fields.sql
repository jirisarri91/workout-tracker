ALTER TABLE user_objectives
  ADD COLUMN IF NOT EXISTS height_cm INT,
  ADD COLUMN IF NOT EXISTS personal_context TEXT,
  ADD COLUMN IF NOT EXISTS equipment TEXT;
