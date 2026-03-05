import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { createOnboardingPlanDraft, deleteOnboardingPlanDraft } from '@/lib/ai/suggestions';
import { getOnboardingDraft, saveOnboardingDraft, TrainingMode } from '@/lib/onboardingDraft';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { commonStyles } from '@/styles/common';

type PlanDay = {
  dayOfWeek: number;
  dayType: string;
};

type PlanMealItem = {
  name: string;
  calories?: number;
  quantity?: number;
  unit?: string;
  protein?: number;
  fat?: number;
  carbs?: number;
};

type PlanMeal = {
  mealType: string;
  name: string;
  items: PlanMealItem[];
};

type PlanWorkout = {
  dayOfWeek?: number;
  dayType?: string;
  name: string;
  cardioDurationMinutes?: number | null;
  cardioType?: string | null;
  exercises?: { name: string; targetSets?: number; targetRepsMin?: number; targetRepsMax?: number }[];
};

type StructuredPlan = {
  dayPlans?: PlanDay[];
  mealsByDayType?: Record<string, PlanMeal[]>;
  workoutsByDay?: PlanWorkout[];
  workoutsByDayType?: Record<string, PlanWorkout | null>;
};

const dayLabel = ['日', '月', '火', '水', '木', '金', '土'];
const dayTypeLabel: Record<string, string> = {
  TRAINING_DAY: '筋トレ',
  CARDIO_DAY: '有酸素',
  HYBRID_DAY: '筋トレ＋有酸素',
  REST_DAY: '休息',
};
const mealTypeLabel: Record<string, string> = {
  BREAKFAST: '朝食',
  LUNCH: '昼食',
  SNACK: '間食',
  POST_WORKOUT: '運動後補食',
  DINNER: '夕食',
};
const previewSteps = ['週間日程', '食事メニュー', 'トレーニング'];

export default function OnboardingProfileScreen() {
  const router = useRouter();
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [targetWeightKg, setTargetWeightKg] = useState('');
  const [targetDurationValue, setTargetDurationValue] = useState('');
  const [targetDurationUnit, setTargetDurationUnit] = useState<'week' | 'month'>('week');
  const [occupation, setOccupation] = useState('');
  const [trainingMode, setTrainingMode] = useState<TrainingMode>('GYM');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [planPreview, setPlanPreview] = useState<StructuredPlan | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewStep, setPreviewStep] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const draft = await getOnboardingDraft();
      if (draft.setupMode !== 'AI') {
        router.replace('/onboarding');
        return;
      }
      setWeightKg(draft.weightKg);
      setHeightCm(draft.heightCm);
      setTargetWeightKg(draft.targetWeightKg);
      setTargetDurationValue(draft.targetDurationValue);
      setTargetDurationUnit(draft.targetDurationUnit);
      setOccupation(draft.occupation);
      setTrainingMode(draft.trainingMode);
      setAiSuggestion(draft.aiSuggestion);
      if (draft.aiSuggestion.trim().startsWith('{')) {
        try {
          setPlanPreview(JSON.parse(draft.aiSuggestion) as StructuredPlan);
        } catch {
          setPlanPreview(null);
        }
      }
    };
    init();
  }, [router]);

  const handleGenerate = async () => {
    const weight = Number(weightKg);
    const height = Number(heightCm);
    const targetWeight = Number(targetWeightKg);
    const durationValue = Number(targetDurationValue);
    if (!weight || !height || !targetWeight || !durationValue || !occupation.trim()) {
      Alert.alert('確認', '体重・身長・目標体重・期間・仕事を入力してください');
      return;
    }

    try {
      setAiLoading(true);
      const result = await createOnboardingPlanDraft({
        weightKg: weight,
        heightCm: height,
        targetWeightKg: targetWeight,
        targetDurationValue: durationValue,
        targetDurationUnit,
        occupation: occupation.trim(),
        trainingMode,
      });
      const prettyPlanJSON = JSON.stringify(result.plan, null, 2);
      setAiSuggestion(prettyPlanJSON);
      setPlanPreview(result.plan as StructuredPlan);
      setPreviewStep(0);
      setPreviewVisible(true);
      await saveOnboardingDraft({
        weightKg,
        heightCm,
        targetWeightKg,
        targetDurationValue,
        targetDurationUnit,
        occupation: occupation.trim(),
        trainingMode,
        aiSuggestion: prettyPlanJSON,
      });
    } catch (error: any) {
      setAiSuggestion(error?.message || 'AI提案の取得に失敗しました。');
    } finally {
      setAiLoading(false);
    }
  };

  const handleNext = async () => {
    if (!aiSuggestion) {
      Alert.alert('確認', '先に「AIプランを作成」を押してください');
      return;
    }
    await saveOnboardingDraft({
      weightKg,
      heightCm,
      targetWeightKg,
      targetDurationValue,
      targetDurationUnit,
      occupation: occupation.trim(),
      trainingMode,
      aiSuggestion,
    });
    router.push('/onboarding/confirm');
  };

  const handleBack = () => {
    void (async () => {
      try {
        await deleteOnboardingPlanDraft();
      } finally {
        router.back();
      }
    })();
  };

  const openPreview = () => {
    setPreviewStep(0);
    setPreviewVisible(true);
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.content}>
        <ScrollView style={styles.scroll} contentContainerStyle={commonStyles.scrollContent}>
          <OnboardingStepper currentStep={2} setupMode="AI" />
          <Text style={styles.title}>基本情報を入力</Text>
          <Text style={commonStyles.subtitle}>入力内容を元にAIがプランを作成します。</Text>

          <TextInput
            style={styles.input}
            placeholder="現在の体重 (kg)"
            keyboardType="decimal-pad"
            value={weightKg}
            onChangeText={setWeightKg}
          />
          <TextInput
            style={styles.input}
            placeholder="身長 (cm)"
            keyboardType="decimal-pad"
            value={heightCm}
            onChangeText={setHeightCm}
          />
          <TextInput
            style={styles.input}
            placeholder="目標体重 (kg)"
            keyboardType="decimal-pad"
            value={targetWeightKg}
            onChangeText={setTargetWeightKg}
          />

          <View style={styles.durationRow}>
            <TextInput
              style={[styles.input, styles.durationInput]}
              placeholder="目標期間"
              keyboardType="number-pad"
              value={targetDurationValue}
              onChangeText={setTargetDurationValue}
            />
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[commonStyles.choiceButton, styles.unitButton, targetDurationUnit === 'week' && commonStyles.choiceButtonActive]}
                onPress={() => setTargetDurationUnit('week')}
              >
                <Text style={[commonStyles.choiceText, targetDurationUnit === 'week' && commonStyles.choiceTextActive]}>
                  週間
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[commonStyles.choiceButton, styles.unitButton, targetDurationUnit === 'month' && commonStyles.choiceButtonActive]}
                onPress={() => setTargetDurationUnit('month')}
              >
                <Text style={[commonStyles.choiceText, targetDurationUnit === 'month' && commonStyles.choiceTextActive]}>
                  ヶ月
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            style={styles.input}
            placeholder="仕事（例: デスクワーク、立ち仕事）"
            value={occupation}
            onChangeText={setOccupation}
          />
          <View style={styles.trainingModeRow}>
            <TouchableOpacity
              style={[commonStyles.choiceButton, styles.trainingModeButton, trainingMode === 'GYM' && commonStyles.choiceButtonActive]}
              onPress={() => setTrainingMode('GYM')}
            >
              <Text style={[commonStyles.choiceText, trainingMode === 'GYM' && commonStyles.choiceTextActive]}>
                ジム
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[commonStyles.choiceButton, styles.trainingModeButton, trainingMode === 'BODYWEIGHT' && commonStyles.choiceButtonActive]}
              onPress={() => setTrainingMode('BODYWEIGHT')}
            >
              <Text style={[commonStyles.choiceText, trainingMode === 'BODYWEIGHT' && commonStyles.choiceTextActive]}>
                自重
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[commonStyles.buttonDark, aiLoading && commonStyles.buttonDisabled]}
            onPress={handleGenerate}
            disabled={aiLoading}
          >
            <Text style={commonStyles.buttonDarkText}>{aiLoading ? 'AIプラン作成中...' : 'AIプランを作成'}</Text>
          </TouchableOpacity>

          <View style={[commonStyles.card, styles.suggestionCard]}>
            <Text style={styles.suggestionTitle}>AIプラン</Text>
            <Text style={styles.suggestionBody}>
              {aiLoading
                ? '提案を作成中...'
                : aiSuggestion
                  ? 'プレビューで内容を確認できます。'
                  : '基本情報を入力して「AIプランを作成」を押してください。'}
            </Text>
            {!!aiSuggestion && (
              <TouchableOpacity style={[commonStyles.buttonSecondary, styles.previewButton]} onPress={openPreview}>
                <Text style={commonStyles.buttonSecondaryText}>プランを確認する</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <View style={commonStyles.footer}>
          <View style={commonStyles.footerRow}>
            <TouchableOpacity style={[commonStyles.buttonSecondary, styles.actionButton]} onPress={handleBack}>
              <Text style={commonStyles.buttonSecondaryText}>戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[commonStyles.buttonPrimary, styles.actionButton]} onPress={handleNext}>
              <Text style={commonStyles.buttonPrimaryText}>次へ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {aiLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#111827" />
            <Text style={styles.loadingText}>AIがプランを作成しています...</Text>
          </View>
        </View>
      )}
      <Modal visible={previewVisible} transparent animationType="slide" onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>AIプランの確認</Text>
              <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                <Text style={styles.modalCloseText}>閉じる</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.previewStepRow}>
              {previewSteps.map((label, idx) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.previewStepChip, previewStep === idx && styles.previewStepChipActive]}
                  onPress={() => setPreviewStep(idx)}
                >
                  <Text style={[styles.previewStepChipText, previewStep === idx && styles.previewStepChipTextActive]}>
                    {idx + 1}. {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {previewStep === 0 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>週間日程</Text>
                  {(planPreview?.dayPlans || [])
                    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                    .map((day) => (
                      <View key={`${day.dayOfWeek}-${day.dayType}`} style={styles.dayCard}>
                        <Text style={styles.dayCardTitle}>{dayLabel[day.dayOfWeek] ?? '-'}曜日</Text>
                        <Text style={styles.dayCardBody}>{dayTypeLabel[day.dayType] ?? day.dayType}</Text>
                      </View>
                    ))}
                </View>
              )}
              {previewStep === 1 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>食事メニュー</Text>
                  {Object.entries(planPreview?.mealsByDayType || {}).map(([dayType, meals]) => (
                    <View key={dayType} style={styles.modalGroup}>
                      <Text style={styles.modalGroupTitle}>{dayTypeLabel[dayType] ?? dayType}</Text>
                      {meals.map((meal) => (
                        <View key={`${dayType}-${meal.mealType}-${meal.name}`} style={styles.mealCard}>
                          <Text style={styles.mealCardTitle}>{meal.name}</Text>
                          <Text style={styles.mealCardType}>{mealTypeLabel[meal.mealType] ?? meal.mealType}</Text>
                          {meal.items.map((item, idx) => (
                            <Text key={`${meal.name}-${item.name}-${idx}`} style={styles.modalSubText}>
                              ・{item.name}
                              {typeof item.quantity === 'number' && item.unit ? ` (${item.quantity}${item.unit})` : ''}
                              {typeof item.calories === 'number' ? ` ${item.calories}kcal` : ''}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
              {previewStep === 2 && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>トレーニングメニュー</Text>
                  {(planPreview?.workoutsByDay || [])
                    .sort((a, b) => (a.dayOfWeek ?? 99) - (b.dayOfWeek ?? 99))
                    .map((workout, idx) => (
                      <View key={`${workout.dayOfWeek ?? 'x'}-${workout.name}-${idx}`} style={styles.workoutCard}>
                        <Text style={styles.modalGroupTitle}>
                          {typeof workout.dayOfWeek === 'number' ? `${dayLabel[workout.dayOfWeek]}曜` : '曜日未設定'} /{' '}
                          {dayTypeLabel[workout.dayType || ''] ?? (workout.dayType || '未設定')}
                        </Text>
                        <Text style={styles.modalText}>{workout.name}</Text>
                        {typeof workout.cardioDurationMinutes === 'number' && (
                          <Text style={styles.modalSubText}>・有酸素 {workout.cardioDurationMinutes}分 {workout.cardioType ?? ''}</Text>
                        )}
                        {(workout.exercises || []).map((ex, exIdx) => (
                          <Text key={`${workout.name}-${ex.name}-${exIdx}`} style={styles.modalSubText}>
                            ・{ex.name}
                            {typeof ex.targetSets === 'number' ? ` ${ex.targetSets}セット` : ''}
                            {typeof ex.targetRepsMin === 'number' && typeof ex.targetRepsMax === 'number'
                              ? ` ${ex.targetRepsMin}-${ex.targetRepsMax}回`
                              : ''}
                          </Text>
                        ))}
                      </View>
                    ))}
                </View>
              )}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[commonStyles.buttonSecondary, styles.modalActionButton, previewStep === 0 && commonStyles.buttonDisabled]}
                onPress={() => setPreviewStep((prev) => Math.max(0, prev - 1))}
                disabled={previewStep === 0}
              >
                <Text style={commonStyles.buttonSecondaryText}>戻る</Text>
              </TouchableOpacity>
              {previewStep < previewSteps.length - 1 ? (
                <TouchableOpacity style={[commonStyles.buttonPrimary, styles.modalActionButton]} onPress={() => setPreviewStep((prev) => Math.min(previewSteps.length - 1, prev + 1))}>
                  <Text style={commonStyles.buttonPrimaryText}>次へ</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[commonStyles.buttonPrimary, styles.modalActionButton]} onPress={() => setPreviewVisible(false)}>
                  <Text style={commonStyles.buttonPrimaryText}>閉じる</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  scroll: { flex: 1 },
  title: {
    ...commonStyles.title,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  input: {
    ...commonStyles.input,
    marginBottom: 10,
  },
  durationRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  durationInput: { flex: 1, marginBottom: 0 },
  unitToggle: { flexDirection: 'row', gap: 8 },
  trainingModeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  trainingModeButton: { flex: 1, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 12 },
  unitButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  suggestionCard: {
    marginTop: 16,
  },
  previewButton: { marginTop: 10 },
  suggestionTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  suggestionBody: { fontSize: 14, lineHeight: 20, color: '#374151' },
  actionButton: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.3)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    maxHeight: '84%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCloseText: {
    color: '#ef6b3b',
    fontWeight: '700',
    fontSize: 13,
  },
  previewStepRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  previewStepChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  previewStepChipActive: {
    borderColor: '#ef6b3b',
    backgroundColor: '#fff7f3',
  },
  previewStepChipText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  previewStepChipTextActive: {
    color: '#ef6b3b',
  },
  modalContent: { paddingBottom: 12 },
  modalSection: { marginBottom: 14 },
  modalSectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 6 },
  modalGroup: { marginBottom: 8 },
  modalGroupTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 4 },
  modalSubGroup: { marginBottom: 4 },
  dayCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  dayCardTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  dayCardBody: { fontSize: 13, color: '#374151', marginTop: 2 },
  mealCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  mealCardTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  mealCardType: { fontSize: 12, color: '#ef6b3b', marginBottom: 4, fontWeight: '700' },
  workoutCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  modalText: { fontSize: 13, color: '#374151', lineHeight: 20 },
  modalSubText: { fontSize: 13, color: '#4b5563', lineHeight: 20, paddingLeft: 8 },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalActionButton: { flex: 1 },
});
