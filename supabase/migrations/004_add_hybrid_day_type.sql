ALTER TABLE day_plans
  DROP CONSTRAINT IF EXISTS day_plans_day_type_check;

ALTER TABLE day_plans
  ADD CONSTRAINT day_plans_day_type_check
  CHECK (day_type IN ('TRAINING_DAY', 'CARDIO_DAY', 'HYBRID_DAY', 'REST_DAY'));
