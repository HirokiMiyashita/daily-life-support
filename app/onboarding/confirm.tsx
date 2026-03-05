import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { applyOnboardingPlanDraft, deleteOnboardingPlanDraft } from '@/lib/ai/suggestions';
import { saveOnboardingState } from '@/lib/onboarding';
import { clearOnboardingDraft, getOnboardingDraft, OnboardingDraft } from '@/lib/onboardingDraft';
import { supabase } from '@/lib/supabase';
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

export default function OnboardingConfirmScreen() {
  const router = useRouter();
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [planPreview, setPlanPreview] = useState<StructuredPlan | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewStep, setPreviewStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const current = await getOnboardingDraft();
      if (!current.setupMode) {
        router.replace('/onboarding');
        return;
      }
      setDraft(current);
      if (current.aiSuggestion?.trim().startsWith('{')) {
        try {
          setPlanPreview(JSON.parse(current.aiSuggestion) as StructuredPlan);
        } catch {
          setPlanPreview(null);
        }
      }
    };
    init();
  }, [router]);

  const handleComplete = async () => {
    if (!draft?.setupMode) return;

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザー情報を取得できませんでした');

      await saveOnboardingState({
        trainingChoice: draft.setupMode,
        mealChoice: draft.setupMode,
        email: user.email ?? null,
      });

      if (draft.setupMode === 'AI') {
        await applyOnboardingPlanDraft();
      }

      await clearOnboardingDraft();
      router.replace('/(tabs)/today');
    } catch (error: any) {
      Alert.alert('エラー', error?.message || 'オンボーディング保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (draft?.setupMode === 'AI') {
      void (async () => {
        try {
          await deleteOnboardingPlanDraft();
        } finally {
          router.replace('/onboarding/profile');
        }
      })();
      return;
    }
    router.replace('/onboarding');
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.content}>
        <ScrollView style={styles.scroll} contentContainerStyle={commonStyles.scrollContent}>
          <OnboardingStepper currentStep={3} setupMode={draft?.setupMode} />
          <Text style={styles.title}>確認</Text>
          <Text style={commonStyles.subtitle}>この内容で開始します。</Text>

          <View style={[commonStyles.card, styles.cardSpacing]}>
            <Text style={styles.cardTitle}>作成方法</Text>
            <Text style={styles.cardBody}>{draft?.setupMode === 'AI' ? 'AIに任せる' : '自分で作成する'}</Text>
          </View>

          {draft?.setupMode === 'AI' && (
            <>
              <View style={[commonStyles.card, styles.cardSpacing]}>
                <Text style={styles.cardTitle}>基本情報</Text>
                <Text style={styles.cardBody}>体重: {draft.weightKg} kg</Text>
                <Text style={styles.cardBody}>身長: {draft.heightCm} cm</Text>
                <Text style={styles.cardBody}>目標体重: {draft.targetWeightKg} kg</Text>
                <Text style={styles.cardBody}>
                  目標期間: {draft.targetDurationValue}
                  {draft.targetDurationUnit === 'month' ? 'ヶ月' : '週間'}
                </Text>
              </View>

              <View style={[commonStyles.card, styles.cardSpacing]}>
                <Text style={styles.cardTitle}>AI提案</Text>
                <Text style={styles.cardBody}>{draft.aiSuggestion ? 'プレビューで確認できます。' : '未作成'}</Text>
                {!!draft.aiSuggestion && (
                  <TouchableOpacity style={[commonStyles.buttonSecondary, styles.previewButton]} onPress={() => { setPreviewStep(0); setPreviewVisible(true); }}>
                    <Text style={commonStyles.buttonSecondaryText}>プランを確認する</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </ScrollView>

        <View style={commonStyles.footer}>
          <View style={commonStyles.footerRow}>
            <TouchableOpacity style={[commonStyles.buttonSecondary, styles.actionButton]} onPress={handleBack}>
              <Text style={commonStyles.buttonSecondaryText}>戻る</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[commonStyles.buttonPrimary, styles.actionButton, saving && commonStyles.buttonDisabled]}
              onPress={handleComplete}
              disabled={saving}
            >
              <Text style={commonStyles.buttonPrimaryText}>{saving ? '保存中...' : 'この内容で開始'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 4,
  },
  cardSpacing: {
    marginBottom: 12,
  },
  previewButton: { marginTop: 10 },
  actionButton: {
    flex: 1,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
