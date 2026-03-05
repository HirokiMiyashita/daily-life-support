import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useMemo, useState } from 'react';
import {
  createWeeklyMealPlans,
  createWeeklyPlan,
  WorkoutDayInput,
  createWeeklyWorkoutPlans,
  getDefaultWeekDayTypes,
  MealType,
} from '@/lib/planCreation';
import { commonStyles, colors } from '@/styles/common';
import { OnboardingStepper } from '@/components/OnboardingStepper';

type DayType = 'TRAINING_DAY' | 'CARDIO_DAY' | 'REST_DAY';

const dayLabels = ['月', '火', '水', '木', '金', '土', '日'];

const dayTypeOptions: { value: DayType; label: string }[] = [
  { value: 'TRAINING_DAY', label: 'トレ' },
  { value: 'CARDIO_DAY', label: '有酸素' },
  { value: 'REST_DAY', label: '休養' },
];

const mealTypeFields: { mealType: MealType; label: string; placeholder: string }[] = [
  { mealType: 'BREAKFAST', label: '朝食', placeholder: '例: オートミールとゆで卵' },
  { mealType: 'LUNCH', label: '昼食', placeholder: '例: 鶏むね肉サラダ' },
  { mealType: 'SNACK', label: '間食', placeholder: '例: プロテインバー' },
  { mealType: 'POST_WORKOUT', label: 'トレ後', placeholder: '例: プロテインシェイク' },
  { mealType: 'DINNER', label: '夕食', placeholder: '例: 魚と野菜の定食' },
];

const defaultMealItems: Record<MealType, string[]> = {
  BREAKFAST: [''],
  LUNCH: [''],
  SNACK: [''],
  POST_WORKOUT: [''],
  DINNER: [''],
};

type WorkoutExerciseForm = {
  name: string;
  targetSets: string;
  targetRepsMin: string;
  targetRepsMax: string;
};

const defaultWorkoutExercise: WorkoutExerciseForm = {
  name: '',
  targetSets: '',
  targetRepsMin: '',
  targetRepsMax: '',
};

type WorkoutDayForm = {
  dayIndex: number;
  dayLabel: string;
  dayType: Exclude<DayType, 'REST_DAY'>;
  cardioDurationMinutes: string;
  exercises: WorkoutExerciseForm[];
};

export function CreatePlanForm({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dayTypes, setDayTypes] = useState<DayType[]>(getDefaultWeekDayTypes());
  const [mealItems, setMealItems] = useState<Record<MealType, string[]>>(defaultMealItems);
  const [mealCalories, setMealCalories] = useState<Record<MealType, string[]>>({
    BREAKFAST: [''],
    LUNCH: [''],
    SNACK: [''],
    POST_WORKOUT: [''],
    DINNER: [''],
  });
  const [workoutDayForms, setWorkoutDayForms] = useState<WorkoutDayForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const summary = useMemo(() => {
    const training = dayTypes.filter((d) => d === 'TRAINING_DAY').length;
    const cardio = dayTypes.filter((d) => d === 'CARDIO_DAY').length;
    const rest = dayTypes.filter((d) => d === 'REST_DAY').length;
    return { training, cardio, rest };
  }, [dayTypes]);

  const ensureWorkoutDayForms = () => {
    setWorkoutDayForms((prev) => {
      const prevMap = new Map(prev.map((item) => [item.dayIndex, item]));
      return dayTypes
        .map((dayType, dayIndex) => ({ dayType, dayIndex }))
        .filter((item): item is { dayType: Exclude<DayType, 'REST_DAY'>; dayIndex: number } => item.dayType !== 'REST_DAY')
        .map((item) => {
          const current = prevMap.get(item.dayIndex);
          if (current && current.dayType === item.dayType) {
            return current;
          }
          return {
            dayIndex: item.dayIndex,
            dayLabel: dayLabels[item.dayIndex],
            dayType: item.dayType,
            cardioDurationMinutes: '',
            exercises: [{ ...defaultWorkoutExercise }],
          };
        });
    });
  };

  const setDayType = (index: number, type: DayType) => {
    const next = [...dayTypes];
    next[index] = type;
    setDayTypes(next);
  };

  const handleCreateWeekPlan = async () => {
    try {
      setSaving(true);
      setErrorMessage('');
      await createWeeklyPlan(dayTypes);
      setStep(2);
    } catch (error: any) {
      setErrorMessage(error?.message || '週間プランの作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeMealItem = (mealType: MealType, index: number, name: string) => {
    setMealItems((prev) => {
      const nextItems = [...prev[mealType]];
      nextItems[index] = name;
      return {
        ...prev,
        [mealType]: nextItems,
      };
    });
  };

  const handleAddMealItem = (mealType: MealType) => {
    setMealItems((prev) => ({ ...prev, [mealType]: [...prev[mealType], ''] }));
    setMealCalories((prev) => ({ ...prev, [mealType]: [...prev[mealType], ''] }));
  };

  const handleRemoveMealItem = (mealType: MealType, index: number) => {
    setMealItems((prev) => {
      if (prev[mealType].length === 1) {
        return prev;
      }
      return {
        ...prev,
        [mealType]: prev[mealType].filter((_, itemIndex) => itemIndex !== index),
      };
    });
    setMealCalories((prev) => {
      if (prev[mealType].length === 1) {
        return prev;
      }
      return {
        ...prev,
        [mealType]: prev[mealType].filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleChangeMealCalories = (mealType: MealType, index: number, calories: string) => {
    setMealCalories((prev) => {
      const next = [...prev[mealType]];
      next[index] = calories.replace(/[^\d]/g, '');
      return {
        ...prev,
        [mealType]: next,
      };
    });
  };

  const handleCreateMeals = async () => {
    const hasNoItem = mealTypeFields.some(
      (field) => mealItems[field.mealType].filter((item) => item.trim().length > 0).length === 0
    );
    if (hasNoItem) {
      setErrorMessage('各食事タイプに1つ以上メニューを入力してください');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');
      await createWeeklyMealPlans(
        mealTypeFields.map((field) => ({
          mealType: field.mealType,
          templateName: field.label,
          items: mealItems[field.mealType].map((name, index) => ({
            name,
            calories: mealCalories[field.mealType][index]
              ? Number(mealCalories[field.mealType][index])
              : null,
          })),
        }))
      );
      ensureWorkoutDayForms();
      setStep(3);
    } catch (error: any) {
      setErrorMessage(error?.message || '食事メニューの作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeWorkoutExercise = (
    dayIndex: number,
    exerciseIndex: number,
    key: keyof WorkoutExerciseForm,
    value: string
  ) => {
    setWorkoutDayForms((prev) =>
      prev.map((day) => {
        if (day.dayIndex !== dayIndex) return day;
        const nextExercises = [...day.exercises];
        nextExercises[exerciseIndex] = {
          ...nextExercises[exerciseIndex],
          [key]: key === 'name' ? value : value.replace(/[^\d]/g, ''),
        };
        return {
          ...day,
          exercises: nextExercises,
        };
      })
    );
  };

  const handleAddWorkoutExercise = (dayIndex: number) => {
    setWorkoutDayForms((prev) =>
      prev.map((day) =>
        day.dayIndex === dayIndex
          ? { ...day, exercises: [...day.exercises, { ...defaultWorkoutExercise }] }
          : day
      )
    );
  };

  const handleRemoveWorkoutExercise = (dayIndex: number, exerciseIndex: number) => {
    setWorkoutDayForms((prev) =>
      prev.map((day) => {
        if (day.dayIndex !== dayIndex) return day;
        if (day.exercises.length === 1) return day;
        return {
          ...day,
          exercises: day.exercises.filter((_, index) => index !== exerciseIndex),
        };
      })
    );
  };

  const handleChangeCardioDuration = (dayIndex: number, value: string) => {
    setWorkoutDayForms((prev) =>
      prev.map((day) =>
        day.dayIndex === dayIndex
          ? { ...day, cardioDurationMinutes: value.replace(/[^\d]/g, '') }
          : day
      )
    );
  };

  const handleCreateWorkouts = async () => {
    try {
      setSaving(true);
      setErrorMessage('');

      await createWeeklyWorkoutPlans(
        dayTypes,
        workoutDayForms.map<WorkoutDayInput>((day) => ({
          dayIndex: day.dayIndex,
          dayType: day.dayType,
          cardioDurationMinutes: day.cardioDurationMinutes ? Number(day.cardioDurationMinutes) : null,
          exercises: day.exercises.map((exercise) => ({
            name: exercise.name,
            targetSets: exercise.targetSets ? Number(exercise.targetSets) : null,
            targetRepsMin: exercise.targetRepsMin ? Number(exercise.targetRepsMin) : null,
            targetRepsMax: exercise.targetRepsMax ? Number(exercise.targetRepsMax) : null,
          })),
        }))
      );

      onComplete();
    } catch (error: any) {
      setErrorMessage(error?.message || 'トレーニングメニューの作成に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (step === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <OnboardingStepper currentStep={1} steps={['週間プラン', '食事メニュー', 'トレーニングメニュー']} />

          <View style={styles.summary}>
            <Text style={styles.summaryText}>トレーニング {summary.training}日</Text>
            <Text style={styles.summaryText}>有酸素 {summary.cardio}日</Text>
            <Text style={styles.summaryText}>休養 {summary.rest}日</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {dayLabels.map((day, idx) => (
            <View key={day} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{day}</Text>
              <View style={styles.optionGroup}>
                {dayTypeOptions.map((option) => {
                  const active = dayTypes[idx] === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[commonStyles.choiceButton, styles.optionButton, active && commonStyles.choiceButtonActive]}
                      onPress={() => setDayType(idx, option.value)}
                    >
                      <Text style={[commonStyles.choiceText, styles.optionText, active && commonStyles.choiceTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={commonStyles.footer}>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <TouchableOpacity
            style={[commonStyles.buttonPrimary, saving && commonStyles.buttonDisabled]}
            onPress={handleCreateWeekPlan}
            disabled={saving}
          >
            <Text style={commonStyles.buttonPrimaryText}>{saving ? '作成中...' : '次へ'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 2) {
    return (
      <View style={styles.container}>
        <View style={styles.headerSection}>
          <OnboardingStepper currentStep={2} steps={['週間プラン', '食事メニュー', 'トレーニングメニュー']} />
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mealInputContainer}>
            {mealTypeFields.map((field) => (
              <View key={field.mealType} style={styles.mealRow}>
                {(() => {
                  const totalCalories = mealCalories[field.mealType].reduce(
                    (sum, value) => sum + (value ? Number(value) : 0),
                    0
                  );
                  return (
                    <Text style={styles.mealTotalCalories}>合計 {totalCalories} kcal</Text>
                  );
                })()}
                <View style={styles.mealHeader}>
                  <Text style={styles.mealLabel}>{field.label}</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddMealItem(field.mealType)}
                    disabled={saving}
                  >
                    <Text style={styles.addButtonText}>+ 追加</Text>
                  </TouchableOpacity>
                </View>
                {mealItems[field.mealType].map((item, index) => (
                  <View key={`${field.mealType}-${index}`} style={styles.mealInputRow}>
                    <TextInput
                      style={[styles.mealInput, styles.mealInputFlex]}
                      placeholder={field.placeholder}
                      value={item}
                      onChangeText={(text) => handleChangeMealItem(field.mealType, index, text)}
                    />
                    <TextInput
                      style={[styles.mealInput, styles.calorieInput]}
                      placeholder="kcal"
                      keyboardType="number-pad"
                      value={mealCalories[field.mealType][index]}
                      onChangeText={(text) => handleChangeMealCalories(field.mealType, index, text)}
                    />
                    <TouchableOpacity
                      style={[
                        styles.removeButton,
                        mealItems[field.mealType].length === 1 && styles.removeButtonDisabled,
                      ]}
                      onPress={() => handleRemoveMealItem(field.mealType, index)}
                      disabled={saving || mealItems[field.mealType].length === 1}
                    >
                      <Text style={styles.removeButtonText}>削除</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={commonStyles.footer}>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[commonStyles.buttonSecondary, styles.actionButton]}
              onPress={() => {
                setErrorMessage('');
                setStep(1);
              }}
              disabled={saving}
            >
              <Text style={commonStyles.buttonSecondaryText}>戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[commonStyles.buttonPrimary, styles.actionButton, saving && commonStyles.buttonDisabled]}
              onPress={handleCreateMeals}
              disabled={saving}
            >
              <Text style={commonStyles.buttonPrimaryText}>{saving ? '登録中...' : '次へ'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <OnboardingStepper currentStep={3} steps={['週間プラン', '食事メニュー', 'トレーニングメニュー']} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {workoutDayForms.map((dayForm) => (
          <View key={`workout-day-${dayForm.dayIndex}`} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <Text style={styles.mealLabel}>
                {dayForm.dayLabel}曜日 {dayForm.dayType === 'TRAINING_DAY' ? 'トレーニング' : '有酸素'}
              </Text>
              {dayForm.dayType === 'TRAINING_DAY' && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddWorkoutExercise(dayForm.dayIndex)}
                  disabled={saving}
                >
                  <Text style={styles.addButtonText}>+ 追加</Text>
                </TouchableOpacity>
              )}
            </View>

            {dayForm.dayType === 'TRAINING_DAY' ? (
              dayForm.exercises.map((exercise, index) => (
                <View key={`workout-${dayForm.dayIndex}-${index}`} style={styles.workoutRow}>
                  <TextInput
                    style={[styles.mealInput, styles.workoutNameInput]}
                    placeholder="種目名（例: スクワット）"
                    value={exercise.name}
                    onChangeText={(text) => handleChangeWorkoutExercise(dayForm.dayIndex, index, 'name', text)}
                  />
                  <View style={styles.workoutMetaRow}>
                    <TextInput
                      style={[styles.mealInput, styles.workoutMetaInput]}
                      placeholder="セット"
                      keyboardType="number-pad"
                      value={exercise.targetSets}
                      onChangeText={(text) => handleChangeWorkoutExercise(dayForm.dayIndex, index, 'targetSets', text)}
                    />
                    <TextInput
                      style={[styles.mealInput, styles.workoutMetaInput]}
                      placeholder="最小回数"
                      keyboardType="number-pad"
                      value={exercise.targetRepsMin}
                      onChangeText={(text) => handleChangeWorkoutExercise(dayForm.dayIndex, index, 'targetRepsMin', text)}
                    />
                    <TextInput
                      style={[styles.mealInput, styles.workoutMetaInput]}
                      placeholder="最大回数"
                      keyboardType="number-pad"
                      value={exercise.targetRepsMax}
                      onChangeText={(text) => handleChangeWorkoutExercise(dayForm.dayIndex, index, 'targetRepsMax', text)}
                    />
                    <TouchableOpacity
                      style={[
                        styles.removeButton,
                        dayForm.exercises.length === 1 && styles.removeButtonDisabled,
                      ]}
                      onPress={() => handleRemoveWorkoutExercise(dayForm.dayIndex, index)}
                      disabled={saving || dayForm.exercises.length === 1}
                    >
                      <Text style={styles.removeButtonText}>削除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <TextInput
                style={[styles.mealInput, styles.workoutCardioInput]}
                placeholder="有酸素時間（分）"
                keyboardType="number-pad"
                value={dayForm.cardioDurationMinutes}
                onChangeText={(text) => handleChangeCardioDuration(dayForm.dayIndex, text)}
              />
            )}
          </View>
        ))}
      </ScrollView>

      <View style={commonStyles.footer}>
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[commonStyles.buttonSecondary, styles.actionButton]}
            onPress={() => {
              setErrorMessage('');
              setStep(2);
            }}
            disabled={saving}
          >
            <Text style={commonStyles.buttonSecondaryText}>戻る</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[commonStyles.buttonPrimary, styles.actionButton, saving && commonStyles.buttonDisabled]}
            onPress={handleCreateWorkouts}
            disabled={saving}
          >
            <Text style={commonStyles.buttonPrimaryText}>{saving ? '登録中...' : 'この内容で登録する'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: commonStyles.title,
  summary: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryText: {
    fontSize: 13,
    color: '#444',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  dayRow: {
    marginBottom: 10,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#222',
  },
  optionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  optionButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 13,
    color: '#444',
  },
  mealInputContainer: {
    marginTop: 8,
    marginBottom: 8,
    gap: 12,
  },
  mealRow: {
    gap: 6,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mealTotalCalories: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    fontWeight: '600',
  },
  mealLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  mealInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  mealInput: {
    ...commonStyles.input,
    marginTop: 6,
  },
  mealInputFlex: {
    flex: 1,
  },
  calorieInput: {
    width: 82,
    textAlign: 'right',
  },
  addButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  addButtonText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    marginTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: '#fff',
  },
  removeButtonDisabled: {
    opacity: 0.4,
  },
  removeButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  workoutCard: {
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.borderMuted,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutRow: {
    gap: 8,
  },
  workoutNameInput: {
    marginTop: 0,
  },
  workoutMetaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  workoutMetaInput: {
    flex: 1,
    marginTop: 0,
    textAlign: 'right',
  },
  workoutCardioInput: {
    marginTop: 0,
    textAlign: 'right',
  },
  actions: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  error: {
    fontSize: 13,
    color: '#d32f2f',
    marginBottom: 8,
  },
});
