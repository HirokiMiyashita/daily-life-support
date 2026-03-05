import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeekPlans } from '@/hooks/useWeekPlans';
import { useRouter } from 'expo-router';
import { TopRightMenu } from '@/components/TopRightMenu';
import { ScreenLoader } from '@/components/ScreenLoader';
import { commonStyles } from '@/styles/common';

const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
const dayTypeLabels: Record<string, string> = {
  TRAINING_DAY: '筋トレ中心日',
  CARDIO_DAY: '有酸素中心日',
  HYBRID_DAY: '筋トレ＋有酸素日',
  REST_DAY: '休養日',
};

export default function WeekScreen() {
  const { data: weekPlans, isLoading } = useWeekPlans();
  const router = useRouter();

  if (isLoading) {
    return <ScreenLoader />;
  }

  // Calculate week start (Monday)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      date: date.toISOString().split('T')[0],
      dateObj: date,
      dayName: dayNames[date.getDay()],
    };
  });

  const handleDayPress = (date: string) => {
    // Navigate to today screen with date parameter
    // For now, just show the date
    router.push({
      pathname: '/(tabs)/today',
      params: { date },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopRightMenu />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={commonStyles.title}>週間プラン</Text>
          <Text style={commonStyles.subtitle}>
            {weekDays[0].dateObj.getMonth() + 1}月{weekDays[0].dateObj.getDate()}日 〜 {weekDays[6].dateObj.getMonth() + 1}月{weekDays[6].dateObj.getDate()}日
          </Text>
        </View>

      <View style={styles.daysContainer}>
        {(!weekPlans || weekPlans.length === 0) && (
          <View style={[commonStyles.card, styles.emptyCard]}>
            <Text style={commonStyles.sectionTitle}>今日のプラン</Text>
            <Text style={styles.emptyText}>週間プランが未設定です</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => router.push('/create-plan')}>
              <Text style={styles.createButtonText}>作成する</Text>
            </TouchableOpacity>
          </View>
        )}
        {(weekPlans || []).map((dayPlan) => {
          const dateObj = new Date(dayPlan.date);
          const isToday = dayPlan.date === new Date().toISOString().split('T')[0];
          const dayName = dayNames[dateObj.getDay()];

          return (
            <TouchableOpacity
              key={dayPlan.id}
              style={[commonStyles.card, styles.dayCard, isToday && styles.dayCardToday]}
              onPress={() => handleDayPress(dayPlan.date)}
            >
              <Text style={styles.dayName}>{dayName}</Text>
              <Text style={styles.dayDate}>
                {dateObj.getMonth() + 1}/{dateObj.getDate()}
              </Text>
              <View style={styles.dayTypeContainer}>
                <Text style={[
                  styles.dayType,
                  dayPlan.day_type === 'TRAINING_DAY' && styles.dayTypeTRAINING_DAY,
                  dayPlan.day_type === 'CARDIO_DAY' && styles.dayTypeCARDIO_DAY,
                  dayPlan.day_type === 'HYBRID_DAY' && styles.dayTypeHYBRID_DAY,
                  dayPlan.day_type === 'REST_DAY' && styles.dayTypeREST_DAY,
                ]}>
                  {dayTypeLabels[dayPlan.day_type]}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {(weekPlans || []).length > 0 && (
        <View style={[commonStyles.card, styles.infoSection]}>
          <Text style={[commonStyles.sectionTitle, styles.infoTitle]}>週間サマリ</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>筋トレ中心日:</Text>
            <Text style={styles.summaryValue}>
              {weekPlans?.filter(dp => dp.day_type === 'TRAINING_DAY').length || 0}日
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>有酸素中心日:</Text>
            <Text style={styles.summaryValue}>
              {weekPlans?.filter(dp => dp.day_type === 'CARDIO_DAY').length || 0}日
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>筋トレ＋有酸素日:</Text>
            <Text style={styles.summaryValue}>
              {weekPlans?.filter(dp => dp.day_type === 'HYBRID_DAY').length || 0}日
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>休養日:</Text>
            <Text style={styles.summaryValue}>
              {weekPlans?.filter(dp => dp.day_type === 'REST_DAY').length || 0}日
            </Text>
          </View>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: commonStyles.safeArea,
  container: commonStyles.screen,
  header: commonStyles.headerContainer,
  daysContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  emptyCard: {
    marginTop: 16,
  },
  emptyText: {
    ...commonStyles.mutedText,
    marginBottom: 10,
  },
  createButton: commonStyles.buttonPrimary,
  createButtonText: commonStyles.buttonPrimaryText,
  dayCard: {
    marginTop: 4,
  },
  dayCardToday: {
    backgroundColor: '#fff',
    borderColor: '#FF6B35',
    borderWidth: 2,
  },
  dayName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dayTypeContainer: {
    marginTop: 4,
  },
  dayType: {
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  dayTypeTRAINING_DAY: {
    backgroundColor: '#ffebee',
    color: '#c62828',
  },
  dayTypeCARDIO_DAY: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  dayTypeHYBRID_DAY: {
    backgroundColor: '#e3f2fd',
    color: '#1565c0',
  },
  dayTypeREST_DAY: {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2',
  },
  infoSection: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  infoTitle: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
