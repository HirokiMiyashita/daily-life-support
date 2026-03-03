import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDayPlan } from '@/hooks/useDayPlan';
import { useTodoItems } from '@/hooks/useTodoItems';
import { useMealPlan } from '@/hooks/useMealPlan';
import { useWorkoutPlan } from '@/hooks/useWorkoutPlan';
import { MealPlan } from '@/components/MealPlan';
import { WorkoutPlan } from '@/components/WorkoutPlan';
import { TopRightMenu } from '@/components/TopRightMenu';
import { ScreenLoader } from '@/components/ScreenLoader';

export default function TodayScreen() {
  const { data: dayPlan, isLoading: dayPlanLoading } = useDayPlan();
  const { data: todos, isLoading: todosLoading } = useTodoItems(dayPlan?.id);
  const { data: mealPlan, isLoading: mealPlanLoading } = useMealPlan(dayPlan?.id);
  const { data: workoutPlan, isLoading: workoutPlanLoading } = useWorkoutPlan(dayPlan?.day_type);

  if (dayPlanLoading || todosLoading || mealPlanLoading || workoutPlanLoading) {
    return <ScreenLoader />;
  }

  const today = new Date();
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const dayName = dayNames[today.getDay()];

  const getDayTypeLabel = () => {
    if (dayPlan?.day_type === 'TRAINING_DAY') return 'トレーニング日';
    if (dayPlan?.day_type === 'CARDIO_DAY') return '有酸素日';
    if (dayPlan?.day_type === 'REST_DAY') return '休養日';
    return '';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopRightMenu />
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.date}>
            {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日({dayName})
          </Text>
          {getDayTypeLabel() && (
            <View style={styles.dayTypeBadge}>
              <Text style={styles.dayTypeText}>{getDayTypeLabel()}</Text>
            </View>
          )}
        </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>今日の食事メニュー</Text>
        <MealPlan mealPlan={mealPlan || []} />
      </View>

      {workoutPlan && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>今日のジムメニュー</Text>
          <WorkoutPlan workoutPlan={workoutPlan} />
        </View>
      )}

      <View style={styles.goalsCard}>
        <Text style={styles.sectionTitle}>今日の目標</Text>
        <View style={styles.goals}>
          <Text style={styles.goalItem}>
            <Text style={styles.goalLabel}>カロリー: </Text>
            <Text style={styles.goalValue}>{dayPlan?.day_type === 'TRAINING_DAY' ? '1450-1550' : '1300'}kcal</Text>
          </Text>
          <Text style={styles.goalItem}>
            <Text style={styles.goalLabel}>タンパク質: </Text>
            <Text style={styles.goalValue}>130g</Text>
          </Text>
          <Text style={styles.goalItem}>
            <Text style={styles.goalLabel}>脂質: </Text>
            <Text style={styles.goalValue}>40g以下</Text>
          </Text>
          <Text style={styles.goalItem}>
            <Text style={styles.goalLabel}>歩数: </Text>
            <Text style={styles.goalValue}>8,000歩</Text>
          </Text>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  date: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  goalsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goals: {
    gap: 12,
  },
  goalItem: {
    fontSize: 16,
  },
  goalLabel: {
    color: '#333',
  },
  goalValue: {
    color: '#FF6B35',
    fontWeight: '600',
  },
});

