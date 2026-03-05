import { supabase } from './supabase';

export type DayType = 'TRAINING_DAY' | 'CARDIO_DAY' | 'REST_DAY';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACK' | 'POST_WORKOUT' | 'DINNER';

export type MealTemplateInput = {
  mealType: MealType;
  templateName: string;
  items: Array<{
    name: string;
    calories: number | null;
  }>;
};

export type WorkoutExerciseInput = {
  name: string;
  targetSets: number | null;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
};

export type WorkoutDayInput = {
  dayIndex: number; // Monday=0 ... Sunday=6
  dayType: Exclude<DayType, 'REST_DAY'>;
  cardioDurationMinutes: number | null;
  exercises: WorkoutExerciseInput[];
};

const dayTypeOrder: DayType[] = [
  'TRAINING_DAY', // Monday
  'TRAINING_DAY', // Tuesday
  'CARDIO_DAY',   // Wednesday
  'TRAINING_DAY', // Thursday
  'TRAINING_DAY', // Friday
  'REST_DAY',     // Saturday
  'REST_DAY',     // Sunday
];

export const getDefaultWeekDayTypes = () => [...dayTypeOrder];

const getCurrentWeekMonday = () => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const getCurrentWeekDateRange = () => {
  const monday = getCurrentWeekMonday();
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    monday: monday.toISOString().split('T')[0],
    sunday: sunday.toISOString().split('T')[0],
  };
};

export const createWeeklyPlan = async (weekDayTypes: DayType[]) => {
  if (weekDayTypes.length !== 7) {
    throw new Error('weekDayTypes must have 7 items');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const monday = getCurrentWeekMonday();

  const dayPlans = weekDayTypes.map((dayType, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      user_id: user.id,
      date: date.toISOString().split('T')[0],
      day_type: dayType,
    };
  });

  const { error: dayPlanError } = await supabase
    .from('day_plans')
    .upsert(dayPlans, { onConflict: 'user_id,date' });

  if (dayPlanError) {
    throw dayPlanError;
  }
};

export const createWeeklyMealPlans = async (templates: MealTemplateInput[]) => {
  const normalizedTemplates = templates
    .map((template) => ({
      mealType: template.mealType,
      templateName: template.templateName.trim(),
      items: template.items
        .map((item) => ({
          name: item.name.trim(),
          calories: item.calories,
        }))
        .filter((item) => item.name.length > 0),
    }))
    .filter((template) => template.items.length > 0);

  if (normalizedTemplates.length === 0) {
    throw new Error('食事メニューを1つ以上入力してください');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { monday, sunday } = getCurrentWeekDateRange();
  const { data: dayPlans, error: dayPlansError } = await supabase
    .from('day_plans')
    .select('id')
    .eq('user_id', user.id)
    .gte('date', monday)
    .lte('date', sunday);

  if (dayPlansError) {
    throw dayPlansError;
  }
  if (!dayPlans || dayPlans.length === 0) {
    throw new Error('先に週間プランを作成してください');
  }

  const { data: createdTemplates, error: templateError } = await supabase
    .from('meal_templates')
    .insert(
      normalizedTemplates.map((template) => ({
        // Store per-meal total calories to display on today screen.
        user_id: user.id,
        meal_type: template.mealType,
        name: template.templateName,
        calories: template.items.reduce((sum, item) => sum + (item.calories ?? 0), 0),
        protein: null,
        fat: null,
        carbs: null,
      }))
    )
    .select('id');

  if (templateError) {
    throw templateError;
  }
  if (!createdTemplates || createdTemplates.length === 0) {
    throw new Error('食事メニューの作成に失敗しました');
  }

  const mealItems = normalizedTemplates.flatMap((template, index) => {
    const templateId = createdTemplates[index]?.id;
    if (!templateId) return [];

    return template.items.map((item, itemIndex) => ({
      user_id: user.id,
      meal_template_id: templateId,
      name: item.name,
      calories: item.calories,
      order_index: itemIndex,
    }));
  });

  if (mealItems.length > 0) {
    const { error: mealItemsError } = await supabase.from('meal_items').insert(mealItems);
    if (mealItemsError) {
      throw mealItemsError;
    }
  }

  const dayPlanIds = dayPlans.map((plan) => plan.id);
  const { error: deleteMealPlansError } = await supabase
    .from('meal_plans')
    .delete()
    .eq('user_id', user.id)
    .in('day_plan_id', dayPlanIds);
  if (deleteMealPlansError) {
    throw deleteMealPlansError;
  }

  const mealPlans = dayPlanIds.flatMap((dayPlanId) =>
    createdTemplates.map((template) => ({
      user_id: user.id,
      day_plan_id: dayPlanId,
      meal_template_id: template.id,
    }))
  );

  const { error: mealPlansError } = await supabase.from('meal_plans').insert(mealPlans);
  if (mealPlansError) {
    throw mealPlansError;
  }
};

const toDbDayOfWeek = (mondayStartIndex: number) => {
  // Monday(0) -> 1 ... Saturday(5) -> 6 ... Sunday(6) -> 0
  return (mondayStartIndex + 1) % 7;
};

export const createWeeklyWorkoutPlans = async (
  weekDayTypes: DayType[],
  workoutDays: WorkoutDayInput[]
) => {
  if (weekDayTypes.length !== 7) {
    throw new Error('weekDayTypes must have 7 items');
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const normalizedDays = workoutDays.map((day) => ({
    dayIndex: day.dayIndex,
    dayType: day.dayType,
    dbDayOfWeek: toDbDayOfWeek(day.dayIndex),
    cardioDurationMinutes: day.cardioDurationMinutes,
    exercises: day.exercises
      .map((exercise) => ({
        name: exercise.name.trim(),
        targetSets: exercise.targetSets,
        targetRepsMin: exercise.targetRepsMin,
        targetRepsMax: exercise.targetRepsMax,
      }))
      .filter((exercise) => exercise.name.length > 0),
  }));

  const targetDbDays = weekDayTypes
    .map((dayType, index) => ({ dayType, dayIndex: index, dbDayOfWeek: toDbDayOfWeek(index) }))
    .filter((item) => item.dayType !== 'REST_DAY');

  if (targetDbDays.length === 0) {
    return;
  }

  for (const day of targetDbDays) {
    const config = normalizedDays.find((item) => item.dayIndex === day.dayIndex && item.dayType === day.dayType);
    if (!config) {
      throw new Error('曜日ごとのトレーニング設定が不足しています');
    }
    if (day.dayType === 'TRAINING_DAY' && config.exercises.length === 0) {
      throw new Error('トレーニング日の種目を1つ以上入力してください');
    }
    if (day.dayType === 'CARDIO_DAY' && (!config.cardioDurationMinutes || config.cardioDurationMinutes <= 0)) {
      throw new Error('有酸素日の時間（分）を入力してください');
    }
  }

  const { data: existingTemplates, error: existingTemplatesError } = await supabase
    .from('workout_templates')
    .select('id, day_of_week')
    .eq('user_id', user.id)
    .in('day_of_week', targetDbDays.map((item) => item.dbDayOfWeek));
  if (existingTemplatesError) {
    throw existingTemplatesError;
  }

  const existingTemplateIds = (existingTemplates || []).map((template) => template.id);
  if (existingTemplateIds.length > 0) {
    const { data: existingLinks, error: existingLinksError } = await supabase
      .from('workout_plan_exercises')
      .select('exercise_template_id')
      .eq('user_id', user.id)
      .in('workout_template_id', existingTemplateIds);
    if (existingLinksError) {
      throw existingLinksError;
    }

    const { error: deleteLinksError } = await supabase
      .from('workout_plan_exercises')
      .delete()
      .eq('user_id', user.id)
      .in('workout_template_id', existingTemplateIds);
    if (deleteLinksError) {
      throw deleteLinksError;
    }

    const { error: deleteTemplatesError } = await supabase
      .from('workout_templates')
      .delete()
      .eq('user_id', user.id)
      .in('id', existingTemplateIds);
    if (deleteTemplatesError) {
      throw deleteTemplatesError;
    }

    const oldExerciseIds = (existingLinks || []).map((link) => link.exercise_template_id);
    if (oldExerciseIds.length > 0) {
      const { error: deleteExercisesError } = await supabase
        .from('exercise_templates')
        .delete()
        .eq('user_id', user.id)
        .in('id', oldExerciseIds);
      if (deleteExercisesError) {
        throw deleteExercisesError;
      }
    }
  }

  const { data: createdTemplates, error: createTemplatesError } = await supabase
    .from('workout_templates')
    .insert(
      targetDbDays.map((item) => ({
        user_id: user.id,
        day_of_week: item.dbDayOfWeek,
        name: item.dayType === 'CARDIO_DAY' ? `有酸素メニュー` : `トレーニングメニュー`,
        cardio_duration_minutes:
          item.dayType === 'CARDIO_DAY'
            ? (normalizedDays.find((day) => day.dayIndex === item.dayIndex)?.cardioDurationMinutes ?? null)
            : null,
        cardio_type: item.dayType === 'CARDIO_DAY' ? 'CARDIO' : null,
      }))
    )
    .select('id, day_of_week, name');
  if (createTemplatesError) {
    throw createTemplatesError;
  }

  for (const template of createdTemplates || []) {
    const dayConfig = normalizedDays.find((day) => day.dbDayOfWeek === template.day_of_week);
    if (!dayConfig || dayConfig.dayType !== 'TRAINING_DAY' || dayConfig.exercises.length === 0) {
      continue;
    }

    const { data: createdExercises, error: createExercisesError } = await supabase
      .from('exercise_templates')
      .insert(
        dayConfig.exercises.map((exercise) => ({
          user_id: user.id,
          name: exercise.name,
          target_sets: null,
          target_reps_min: null,
          target_reps_max: null,
        }))
      )
      .select('id');
    if (createExercisesError) {
      throw createExercisesError;
    }

    const links = (createdExercises || []).map((exercise, index) => ({
      user_id: user.id,
      workout_template_id: template.id,
      exercise_template_id: exercise.id,
      target_sets: dayConfig.exercises[index]?.targetSets ?? null,
      target_reps_min: dayConfig.exercises[index]?.targetRepsMin ?? null,
      target_reps_max: dayConfig.exercises[index]?.targetRepsMax ?? null,
      order_index: index,
    }));

    if (links.length === 0) {
      continue;
    }
    const { error: linksError } = await supabase.from('workout_plan_exercises').insert(links);
    if (linksError) {
      throw linksError;
    }
  }
};
