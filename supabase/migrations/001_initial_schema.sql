-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (profile table linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Plans table (半年プラン)
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  target_weight DECIMAL(5, 2) NOT NULL,
  initial_weight DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Day Plans table (特定日のプラン)
CREATE TABLE IF NOT EXISTS day_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  day_type TEXT NOT NULL CHECK (day_type IN ('TRAINING_DAY', 'CARDIO_DAY', 'REST_DAY')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Meal Templates table (食事テンプレート)
CREATE TABLE IF NOT EXISTS meal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'SNACK', 'POST_WORKOUT', 'DINNER')),
  calories INTEGER,
  protein DECIMAL(5, 2),
  fat DECIMAL(5, 2),
  carbs DECIMAL(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Meal Plans table (特定日の食事プラン)
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_plan_id UUID NOT NULL REFERENCES day_plans(id) ON DELETE CASCADE,
  meal_template_id UUID NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Meal Items table (食事アイテム)
CREATE TABLE IF NOT EXISTS meal_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_template_id UUID NOT NULL REFERENCES meal_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  calories INTEGER,
  protein DECIMAL(5, 2),
  fat DECIMAL(5, 2),
  carbs DECIMAL(5, 2),
  quantity DECIMAL(5, 2),
  unit TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Workout Templates table (ワークアウトテンプレート)
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
  cardio_duration_minutes INTEGER,
  cardio_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Exercise Templates table (種目テンプレート)
CREATE TABLE IF NOT EXISTS exercise_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_reps_min INTEGER,
  target_reps_max INTEGER,
  target_sets INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Workout Plan Exercises table (ワークアウトプランと種目の紐付け)
CREATE TABLE IF NOT EXISTS workout_plan_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_template_id UUID NOT NULL REFERENCES exercise_templates(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Todo Templates table (ToDoテンプレート)
CREATE TABLE IF NOT EXISTS todo_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  day_type TEXT CHECK (day_type IN ('DAILY', 'TRAINING_DAY', 'CARDIO_DAY', 'WEEKLY')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Todo Items table (特定日のToDoアイテム)
CREATE TABLE IF NOT EXISTS todo_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_plan_id UUID NOT NULL REFERENCES day_plans(id) ON DELETE CASCADE,
  todo_template_id UUID REFERENCES todo_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Daily Logs table (日次ログ)
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_plan_id UUID REFERENCES day_plans(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  weight DECIMAL(5, 2),
  waist DECIMAL(5, 2),
  steps INTEGER,
  sleep_hours DECIMAL(4, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Exercise Logs table (種目ログ)
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_plan_id UUID NOT NULL REFERENCES day_plans(id) ON DELETE CASCADE,
  exercise_template_id UUID NOT NULL REFERENCES exercise_templates(id) ON DELETE CASCADE,
  weight DECIMAL(5, 2),
  reps INTEGER,
  sets INTEGER,
  notes TEXT,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Ingredients table (食材マスタ)
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('PROTEIN', 'VEGETABLE', 'CARB', 'OTHER')),
  default_unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Meal Item Ingredients table (メニュー↔食材の紐付け)
CREATE TABLE IF NOT EXISTS meal_item_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_item_id UUID NOT NULL REFERENCES meal_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(8, 2) NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Shopping Lists table (週次の買い物リスト)
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(user_id, week_start_date)
);

-- Shopping List Items table (買い物リストアイテム)
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(8, 2) NOT NULL,
  unit TEXT NOT NULL,
  purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_day_plans_user_date ON day_plans(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meal_plans_day_plan ON meal_plans(day_plan_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_day_plan ON todo_items(day_plan_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_day_plan ON exercise_logs(day_plan_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_user_week ON shopping_lists(user_id, week_start_date);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Generic RLS policies for all other tables
CREATE POLICY "Users can manage own plans" ON plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own day_plans" ON day_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own meal_templates" ON meal_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own meal_plans" ON meal_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own meal_items" ON meal_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workout_templates" ON workout_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own exercise_templates" ON exercise_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own workout_plan_exercises" ON workout_plan_exercises
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own todo_templates" ON todo_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own todo_items" ON todo_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily_logs" ON daily_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own exercise_logs" ON exercise_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own ingredients" ON ingredients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own meal_item_ingredients" ON meal_item_ingredients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own shopping_lists" ON shopping_lists
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own shopping_list_items" ON shopping_list_items
  FOR ALL USING (auth.uid() = user_id);

