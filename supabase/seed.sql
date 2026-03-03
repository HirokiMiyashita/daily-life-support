-- Seed data function
-- This function should be called after a user is authenticated
-- Usage: SELECT seed_user_data();

CREATE OR REPLACE FUNCTION seed_user_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  breakfast_template_id UUID;
  lunch_template_id UUID;
  snack_template_id UUID;
  post_workout_template_id UUID;
  dinner_template_id UUID;
  monday_workout_id UUID;
  tuesday_workout_id UUID;
  wednesday_workout_id UUID;
  thursday_workout_id UUID;
  friday_workout_id UUID;
  chicken_breast_id UUID;
  salmon_id UUID;
  rice_id UUID;
  egg_id UUID;
  protein_powder_id UUID;
  greek_yogurt_id UUID;
  banana_id UUID;
  broccoli_id UUID;
  cabbage_id UUID;
  tofu_id UUID;
  natto_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if data already exists
  IF EXISTS (SELECT 1 FROM meal_templates WHERE user_id = current_user_id LIMIT 1) THEN
    RAISE NOTICE 'Seed data already exists for this user';
    RETURN;
  END IF;

  -- ============================================
  -- INGREDIENTS (食材マスタ)
  -- ============================================
  
  -- Protein
  INSERT INTO ingredients (user_id, name, category, default_unit) VALUES
    (current_user_id, '鶏むね肉', 'PROTEIN', 'g'),
    (current_user_id, '鶏もも肉（皮なし）', 'PROTEIN', 'g'),
    (current_user_id, '鮭', 'PROTEIN', 'piece'),
    (current_user_id, 'サバ', 'PROTEIN', 'piece'),
    (current_user_id, '赤身肉', 'PROTEIN', 'g'),
    (current_user_id, 'プロテインパウダー', 'PROTEIN', 'serving'),
    (current_user_id, '卵', 'PROTEIN', 'piece'),
    (current_user_id, '豆腐', 'PROTEIN', 'piece'),
    (current_user_id, '納豆', 'PROTEIN', 'pack')
  ON CONFLICT DO NOTHING;

  SELECT id INTO chicken_breast_id FROM ingredients WHERE user_id = current_user_id AND name = '鶏むね肉' LIMIT 1;
  SELECT id INTO salmon_id FROM ingredients WHERE user_id = current_user_id AND name = '鮭' LIMIT 1;
  SELECT id INTO protein_powder_id FROM ingredients WHERE user_id = current_user_id AND name = 'プロテインパウダー' LIMIT 1;
  SELECT id INTO egg_id FROM ingredients WHERE user_id = current_user_id AND name = '卵' LIMIT 1;
  SELECT id INTO tofu_id FROM ingredients WHERE user_id = current_user_id AND name = '豆腐' LIMIT 1;
  SELECT id INTO natto_id FROM ingredients WHERE user_id = current_user_id AND name = '納豆' LIMIT 1;

  -- Vegetables
  INSERT INTO ingredients (user_id, name, category, default_unit) VALUES
    (current_user_id, '冷凍ブロッコリー', 'VEGETABLE', 'bag'),
    (current_user_id, 'キャベツ', 'VEGETABLE', 'piece'),
    (current_user_id, '野菜（両手2杯）', 'VEGETABLE', 'serving')
  ON CONFLICT DO NOTHING;

  SELECT id INTO broccoli_id FROM ingredients WHERE user_id = current_user_id AND name = '冷凍ブロッコリー' LIMIT 1;
  SELECT id INTO cabbage_id FROM ingredients WHERE user_id = current_user_id AND name = 'キャベツ' LIMIT 1;

  -- Carbs
  INSERT INTO ingredients (user_id, name, category, default_unit) VALUES
    (current_user_id, '白米（炊飯後）', 'CARB', 'g'),
    (current_user_id, 'バナナ', 'CARB', 'piece')
  ON CONFLICT DO NOTHING;

  SELECT id INTO rice_id FROM ingredients WHERE user_id = current_user_id AND name = '白米（炊飯後）' LIMIT 1;
  SELECT id INTO banana_id FROM ingredients WHERE user_id = current_user_id AND name = 'バナナ' LIMIT 1;

  -- Other
  INSERT INTO ingredients (user_id, name, category, default_unit) VALUES
    (current_user_id, 'ギリシャヨーグルト', 'OTHER', 'g'),
    (current_user_id, '低脂質ヨーグルト', 'OTHER', 'g'),
    (current_user_id, '味噌汁', 'OTHER', 'serving')
  ON CONFLICT DO NOTHING;

  SELECT id INTO greek_yogurt_id FROM ingredients WHERE user_id = current_user_id AND name = 'ギリシャヨーグルト' LIMIT 1;

  -- ============================================
  -- MEAL TEMPLATES (食事テンプレート)
  -- ============================================

  -- Breakfast (朝食) - 200-250kcal
  INSERT INTO meal_templates (user_id, name, meal_type, calories, protein, fat, carbs)
  VALUES (current_user_id, '朝食', 'BREAKFAST', 225, 22.5, 5, 15)
  RETURNING id INTO breakfast_template_id;

  -- Lunch (昼食) - 500-550kcal
  INSERT INTO meal_templates (user_id, name, meal_type, calories, protein, fat, carbs)
  VALUES (current_user_id, '昼食', 'LUNCH', 525, 45, 10, 60)
  RETURNING id INTO lunch_template_id;

  -- Snack (間食) - 100-150kcal
  INSERT INTO meal_templates (user_id, name, meal_type, calories, protein, fat, carbs)
  VALUES (current_user_id, '間食', 'SNACK', 125, 20, 2, 10)
  RETURNING id INTO snack_template_id;

  -- Post Workout (トレ後) - 150-200kcal
  INSERT INTO meal_templates (user_id, name, meal_type, calories, protein, fat, carbs)
  VALUES (current_user_id, 'トレ後', 'POST_WORKOUT', 175, 25, 2, 20)
  RETURNING id INTO post_workout_template_id;

  -- Dinner (夕食) - 400-450kcal
  INSERT INTO meal_templates (user_id, name, meal_type, calories, protein, fat, carbs)
  VALUES (current_user_id, '夕食', 'DINNER', 425, 40, 15, 25)
  RETURNING id INTO dinner_template_id;

  -- ============================================
  -- MEAL ITEMS (食事アイテム)
  -- ============================================

  -- Breakfast items
  INSERT INTO meal_items (user_id, meal_template_id, name, calories, protein, quantity, unit, order_index)
  VALUES
    (current_user_id, breakfast_template_id, 'プロテイン', 100, 20, 1, 'serving', 1),
    (current_user_id, breakfast_template_id, 'ギリシャヨーグルト', 100, 10, 100, 'g', 2);

  -- Lunch items
  INSERT INTO meal_items (user_id, meal_template_id, name, calories, protein, quantity, unit, order_index)
  VALUES
    (current_user_id, lunch_template_id, '鶏むね肉', 330, 44, 200, 'g', 1),
    (current_user_id, lunch_template_id, '白米（炊飯後）', 168, 4, 100, 'g', 2),
    (current_user_id, lunch_template_id, '野菜（両手2杯）', 20, 1, 2, 'serving', 3),
    (current_user_id, lunch_template_id, '味噌汁', 20, 1, 1, 'serving', 4);

  -- Snack items
  INSERT INTO meal_items (user_id, meal_template_id, name, calories, protein, quantity, unit, order_index)
  VALUES
    (current_user_id, snack_template_id, 'プロテイン', 100, 20, 1, 'serving', 1);

  -- Post workout items
  INSERT INTO meal_items (user_id, meal_template_id, name, calories, protein, quantity, unit, order_index)
  VALUES
    (current_user_id, post_workout_template_id, 'プロテイン', 100, 20, 1, 'serving', 1),
    (current_user_id, post_workout_template_id, 'バナナ', 50, 1, 0.5, 'piece', 2);

  -- Dinner items
  INSERT INTO meal_items (user_id, meal_template_id, name, calories, protein, quantity, unit, order_index)
  VALUES
    (current_user_id, dinner_template_id, '鮭', 250, 30, 1, 'piece', 1),
    (current_user_id, dinner_template_id, '豆腐', 80, 7, 1, 'piece', 2),
    (current_user_id, dinner_template_id, '野菜（両手2杯）', 20, 1, 2, 'serving', 3);

  -- ============================================
  -- MEAL ITEM INGREDIENTS (メニュー↔食材の紐付け)
  -- ============================================

  -- Breakfast: プロテイン
  INSERT INTO meal_item_ingredients (user_id, meal_item_id, ingredient_id, quantity, unit)
  SELECT current_user_id, mi.id, protein_powder_id, 1, 'serving'
  FROM meal_items mi
  WHERE mi.user_id = current_user_id AND mi.name = 'プロテイン' AND mi.meal_template_id = breakfast_template_id;

  -- Breakfast: ギリシャヨーグルト
  INSERT INTO meal_item_ingredients (user_id, meal_item_id, ingredient_id, quantity, unit)
  SELECT current_user_id, mi.id, greek_yogurt_id, 100, 'g'
  FROM meal_items mi
  WHERE mi.user_id = current_user_id AND mi.name = 'ギリシャヨーグルト';

  -- Lunch: 鶏むね肉
  INSERT INTO meal_item_ingredients (user_id, meal_item_id, ingredient_id, quantity, unit)
  SELECT current_user_id, mi.id, chicken_breast_id, 200, 'g'
  FROM meal_items mi
  WHERE mi.user_id = current_user_id AND mi.name = '鶏むね肉';

  -- Lunch: 白米
  INSERT INTO meal_item_ingredients (user_id, meal_item_id, ingredient_id, quantity, unit)
  SELECT current_user_id, mi.id, rice_id, 100, 'g'
  FROM meal_items mi
  WHERE mi.user_id = current_user_id AND mi.name = '白米（炊飯後）';

  -- Post workout: バナナ
  INSERT INTO meal_item_ingredients (user_id, meal_item_id, ingredient_id, quantity, unit)
  SELECT current_user_id, mi.id, banana_id, 0.5, 'piece'
  FROM meal_items mi
  WHERE mi.user_id = current_user_id AND mi.name = 'バナナ';

  -- Dinner: 鮭
  INSERT INTO meal_item_ingredients (user_id, meal_item_id, ingredient_id, quantity, unit)
  SELECT current_user_id, mi.id, salmon_id, 1, 'piece'
  FROM meal_items mi
  WHERE mi.user_id = current_user_id AND mi.name = '鮭';

  -- Dinner: 豆腐
  INSERT INTO meal_item_ingredients (user_id, meal_item_id, ingredient_id, quantity, unit)
  SELECT current_user_id, mi.id, tofu_id, 1, 'piece'
  FROM meal_items mi
  WHERE mi.user_id = current_user_id AND mi.name = '豆腐';

  -- ============================================
  -- EXERCISE TEMPLATES (種目テンプレート)
  -- ============================================

  -- Monday exercises
  INSERT INTO exercise_templates (user_id, name, target_reps_min, target_reps_max, target_sets, notes)
  VALUES
    (current_user_id, 'レッグプレス', 8, 12, 4, 'RIR2'),
    (current_user_id, 'ルーマニアンデッドリフト', 8, 10, 3, 'RIR2'),
    (current_user_id, 'レッグカール', 10, 15, 3, 'RIR2'),
    (current_user_id, 'カーフレイズ', 12, 20, 3, 'RIR2');

  -- Tuesday exercises
  INSERT INTO exercise_templates (user_id, name, target_reps_min, target_reps_max, target_sets, notes)
  VALUES
    (current_user_id, 'チェストプレス', 8, 12, 4, 'RIR2'),
    (current_user_id, 'ショルダープレス', 8, 12, 3, 'RIR2'),
    (current_user_id, 'サイドレイズ', 12, 20, 3, 'RIR2'),
    (current_user_id, 'トライセプスプレスダウン', 10, 15, 3, 'RIR2');

  -- Wednesday exercises
  INSERT INTO exercise_templates (user_id, name, target_reps_min, target_reps_max, target_sets, notes)
  VALUES
    (current_user_id, 'プランク', 40, 40, 3, '秒'),
    (current_user_id, '腹筋マシン', 12, 12, 3, 'RIR2');

  -- Thursday exercises
  INSERT INTO exercise_templates (user_id, name, target_reps_min, target_reps_max, target_sets, notes)
  VALUES
    (current_user_id, 'ラットプルダウン', 8, 12, 4, 'RIR2'),
    (current_user_id, 'シーテッドロー', 8, 12, 3, 'RIR2'),
    (current_user_id, 'フェイスプル', 12, 20, 3, 'RIR2'),
    (current_user_id, 'バックエクステンション', 10, 15, 3, 'RIR2');

  -- Friday exercises
  INSERT INTO exercise_templates (user_id, name, target_reps_min, target_reps_max, target_sets, notes)
  VALUES
    (current_user_id, 'ブルガリアンスクワット', 10, 10, 3, 'RIR2'),
    (current_user_id, 'レッグエクステンション', 12, 15, 3, 'RIR2'),
    (current_user_id, 'ヒップスラスト', 10, 12, 3, 'RIR2'),
    (current_user_id, 'カーフレイズ', 15, 15, 3, 'RIR2');

  -- ============================================
  -- WORKOUT TEMPLATES (ワークアウトテンプレート)
  -- ============================================

  -- Monday: 下半身①（重め）＋有酸素30分
  INSERT INTO workout_templates (user_id, name, day_of_week, cardio_duration_minutes, cardio_type)
  VALUES (current_user_id, '下半身①（重め）', 1, 30, '傾斜ウォーク')
  RETURNING id INTO monday_workout_id;

  -- Tuesday: Push（胸・肩・腕）＋有酸素15〜20分
  INSERT INTO workout_templates (user_id, name, day_of_week, cardio_duration_minutes, cardio_type)
  VALUES (current_user_id, 'Push（胸・肩・腕）', 2, 18, '傾斜ウォーク')
  RETURNING id INTO tuesday_workout_id;

  -- Wednesday: 有酸素Day（45〜60分）＋体幹＋ストレッチ
  INSERT INTO workout_templates (user_id, name, day_of_week, cardio_duration_minutes, cardio_type)
  VALUES (current_user_id, '有酸素Day', 3, 52, '傾斜ウォーク or クロストレーナー')
  RETURNING id INTO wednesday_workout_id;

  -- Thursday: Pull（背中）＋有酸素15〜20分
  INSERT INTO workout_templates (user_id, name, day_of_week, cardio_duration_minutes, cardio_type)
  VALUES (current_user_id, 'Pull（背中）', 4, 18, '傾斜ウォーク')
  RETURNING id INTO thursday_workout_id;

  -- Friday: 下半身②（ボリューム）＋有酸素30分
  INSERT INTO workout_templates (user_id, name, day_of_week, cardio_duration_minutes, cardio_type)
  VALUES (current_user_id, '下半身②（ボリューム）', 5, 30, '傾斜ウォーク')
  RETURNING id INTO friday_workout_id;

  -- ============================================
  -- WORKOUT PLAN EXERCISES (ワークアウトプランと種目の紐付け)
  -- ============================================

  -- Monday exercises
  INSERT INTO workout_plan_exercises (user_id, workout_template_id, exercise_template_id, order_index)
  SELECT current_user_id, monday_workout_id, et.id, ROW_NUMBER() OVER (ORDER BY et.name)
  FROM exercise_templates et
  WHERE et.user_id = current_user_id AND et.name IN ('レッグプレス', 'ルーマニアンデッドリフト', 'レッグカール', 'カーフレイズ')
  ORDER BY et.name;

  -- Tuesday exercises
  INSERT INTO workout_plan_exercises (user_id, workout_template_id, exercise_template_id, order_index)
  SELECT current_user_id, tuesday_workout_id, et.id, ROW_NUMBER() OVER (ORDER BY et.name)
  FROM exercise_templates et
  WHERE et.user_id = current_user_id AND et.name IN ('チェストプレス', 'ショルダープレス', 'サイドレイズ', 'トライセプスプレスダウン')
  ORDER BY et.name;

  -- Wednesday exercises
  INSERT INTO workout_plan_exercises (user_id, workout_template_id, exercise_template_id, order_index)
  SELECT current_user_id, wednesday_workout_id, et.id, ROW_NUMBER() OVER (ORDER BY et.name)
  FROM exercise_templates et
  WHERE et.user_id = current_user_id AND et.name IN ('プランク', '腹筋マシン')
  ORDER BY et.name;

  -- Thursday exercises
  INSERT INTO workout_plan_exercises (user_id, workout_template_id, exercise_template_id, order_index)
  SELECT current_user_id, thursday_workout_id, et.id, ROW_NUMBER() OVER (ORDER BY et.name)
  FROM exercise_templates et
  WHERE et.user_id = current_user_id AND et.name IN ('ラットプルダウン', 'シーテッドロー', 'フェイスプル', 'バックエクステンション')
  ORDER BY et.name;

  -- Friday exercises
  INSERT INTO workout_plan_exercises (user_id, workout_template_id, exercise_template_id, order_index)
  SELECT current_user_id, friday_workout_id, et.id, ROW_NUMBER() OVER (ORDER BY et.name)
  FROM exercise_templates et
  WHERE et.user_id = current_user_id AND et.name IN ('ブルガリアンスクワット', 'レッグエクステンション', 'ヒップスラスト', 'カーフレイズ')
  ORDER BY et.name;

  -- ============================================
  -- TODO TEMPLATES (ToDoテンプレート)
  -- ============================================

  -- Daily todos
  INSERT INTO todo_templates (user_id, title, description, day_type, order_index)
  VALUES
    (current_user_id, '朝の体重測定', '07:30', 'DAILY', 1),
    (current_user_id, '水を飲む', '起床後', 'DAILY', 2),
    (current_user_id, '朝食', '07:40', 'DAILY', 3),
    (current_user_id, '昼食', '12:00', 'DAILY', 4),
    (current_user_id, '食後散歩15分', '12:20', 'DAILY', 5),
    (current_user_id, '間食', '15:30', 'DAILY', 6),
    (current_user_id, '歩数目標達成', '8,000歩', 'DAILY', 7),
    (current_user_id, '風呂後ストレッチ', '21:30', 'DAILY', 8),
    (current_user_id, '就寝', '23:30', 'DAILY', 9);

  -- Training day todos
  INSERT INTO todo_templates (user_id, title, description, day_type, order_index)
  VALUES
    (current_user_id, 'ジム：筋トレ', '18:30〜', 'TRAINING_DAY', 1),
    (current_user_id, 'ジム：有酸素', '20〜30分', 'TRAINING_DAY', 2),
    (current_user_id, 'トレ後プロテイン＋糖質', '20:00', 'TRAINING_DAY', 3),
    (current_user_id, '夕食', '20:30', 'TRAINING_DAY', 4);

  -- Cardio day todos
  INSERT INTO todo_templates (user_id, title, description, day_type, order_index)
  VALUES
    (current_user_id, '有酸素45〜60分', '', 'CARDIO_DAY', 1),
    (current_user_id, '体幹（プランク/腹筋）', '', 'CARDIO_DAY', 2),
    (current_user_id, 'ストレッチ10分', '', 'CARDIO_DAY', 3);

  -- Weekly todos
  INSERT INTO todo_templates (user_id, title, description, day_type, order_index)
  VALUES
    (current_user_id, 'ウエスト計測', '週1', 'WEEKLY', 1),
    (current_user_id, '写真', '正面/横/後ろ', 'WEEKLY', 2);

  RAISE NOTICE 'Seed data created successfully for user %', current_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION seed_user_data() TO authenticated;

