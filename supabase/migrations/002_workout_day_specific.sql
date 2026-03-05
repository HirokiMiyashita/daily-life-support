-- Make workout templates unique per user/day and
-- move per-day prescription fields to workout_plan_exercises.

CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_templates_user_day
  ON workout_templates(user_id, day_of_week);

ALTER TABLE workout_plan_exercises
  ADD COLUMN IF NOT EXISTS target_sets INTEGER,
  ADD COLUMN IF NOT EXISTS target_reps_min INTEGER,
  ADD COLUMN IF NOT EXISTS target_reps_max INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT;
