import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useDayPlan } from '@/hooks/useDayPlan';
import { useTodoItems } from '@/hooks/useTodoItems';
import { useMealPlan } from '@/hooks/useMealPlan';
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { MealPlan } from '@/components/MealPlan';
import { WorkoutPlan } from '@/components/WorkoutPlan';
import { TopRightMenu } from '@/components/TopRightMenu';
import { ScreenLoader } from '@/components/ScreenLoader';
import { commonStyles } from '@/styles/common';

export default function TodayScreen() {
  const router = useRouter();
  const { data: dayPlan, isLoading: dayPlanLoading } = useDayPlan();
  const { data: todos, isLoading: todosLoading } = useTodoItems(dayPlan?.id);
  const { data: mealPlan, isLoading: mealPlanLoading } = useMealPlan(dayPlan?.id);
  const { data: workoutPlan, isLoading: workoutPlanLoading } = useWorkoutPlan(dayPlan?.day_type);

  if (dayPlanLoading || todosLoading || mealPlanLoading || workoutPlanLoading) {
    return <ScreenLoader />;
  }

  const today = new Date();
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const dayName = dayNames[today.getDay()-1];

  const getDayTypeLabel = () => {
    if (!dayPlan) return '';
    if (dayPlan?.day_type === 'TRAINING_DAY') return '筋トレ中心日';
    if (dayPlan?.day_type === 'CARDIO_DAY') return '有酸素中心日';
    if (dayPlan?.day_type === 'HYBRID_DAY') return '筋トレ＋有酸素日';
    if (dayPlan?.day_type === 'REST_DAY') return '休養日';
    return '';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopRightMenu />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={[commonStyles.title, styles.date]}>
            {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日({dayName})
          </Text>
          {getDayTypeLabel() && (
            <View style={styles.dayTypeBadge}>
              <Text style={styles.dayTypeText}>{getDayTypeLabel()}</Text>
            </View>
          )}
        </View>

      {dayPlan ? (
        <View style={[commonStyles.card, styles.card]}>
          <Text style={commonStyles.sectionTitle}>今日の食事メニュー</Text>
          <MealPlan mealPlan={mealPlan || []} />
          {(!mealPlan || mealPlan.length === 0) && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-plan')}
            >
              <Text style={styles.createButtonText}>作成する</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={[commonStyles.card, styles.card]}>
          <Text style={commonStyles.sectionTitle}>今日の食事メニュー</Text>
          <Text style={styles.emptyStateText}>プラン未設定</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/create-plan')}
          >
            <Text style={styles.createButtonText}>作成する</Text>
          </TouchableOpacity>
        </View>
      )}

      {workoutPlan && (
        <View style={[commonStyles.card, styles.card]}>
          <Text style={commonStyles.sectionTitle}>今日のジムメニュー</Text>
          <WorkoutPlan workoutPlan={workoutPlan} />
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: commonStyles.safeArea,
  container: commonStyles.screen,
  contentContainer: {
    paddingBottom: 20,
  },
  header: commonStyles.headerContainer,
  date: {
    marginBottom: 12,
  },
  dayTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dayTypeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  emptyStateText: {
    ...commonStyles.mutedText,
    fontStyle: 'italic',
  },
  createButton: {
    marginTop: 14,
    ...commonStyles.buttonPrimary,
    paddingVertical: 12,
  },
  createButtonText: commonStyles.buttonPrimaryText,
});

