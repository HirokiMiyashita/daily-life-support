import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeekPlans } from '@/hooks/useWeekPlans';
import { useRouter } from 'expo-router';
import { TopRightMenu } from '@/components/TopRightMenu';
import { ScreenLoader } from '@/components/ScreenLoader';

const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
const dayTypeLabels: Record<string, string> = {
  TRAINING_DAY: 'トレーニング日',
  CARDIO_DAY: '有酸素日',
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

  const getDayPlan = (date: string) => {
    return weekPlans?.find(dp => dp.date === date);
  };

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
          <Text style={styles.title}>週間プラン</Text>
          <Text style={styles.subtitle}>
            {weekDays[0].dateObj.getMonth() + 1}月{weekDays[0].dateObj.getDate()}日 〜 {weekDays[6].dateObj.getMonth() + 1}月{weekDays[6].dateObj.getDate()}日
          </Text>
        </View>

      <View style={styles.daysContainer}>
        {weekDays.map((day) => {
          const dayPlan = getDayPlan(day.date);
          const isToday = day.date === new Date().toISOString().split('T')[0];

          return (
            <TouchableOpacity
              key={day.date}
              style={[styles.dayCard, isToday && styles.dayCardToday]}
              onPress={() => handleDayPress(day.date)}
            >
              <Text style={styles.dayName}>{day.dayName}</Text>
              <Text style={styles.dayDate}>
                {day.dateObj.getMonth() + 1}/{day.dateObj.getDate()}
              </Text>
              {dayPlan && (
                <View style={styles.dayTypeContainer}>
                  <Text style={[
                    styles.dayType,
                    dayPlan.day_type === 'TRAINING_DAY' && styles.dayTypeTRAINING_DAY,
                    dayPlan.day_type === 'CARDIO_DAY' && styles.dayTypeCARDIO_DAY,
                    dayPlan.day_type === 'REST_DAY' && styles.dayTypeREST_DAY,
                  ]}>
                    {dayTypeLabels[dayPlan.day_type]}
                  </Text>
                </View>
              )}
              {!dayPlan && (
                <Text style={styles.dayTypePlaceholder}>未設定</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>週間サマリ</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>トレーニング日:</Text>
          <Text style={styles.summaryValue}>
            {weekPlans?.filter(dp => dp.day_type === 'TRAINING_DAY').length || 0}日
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>有酸素日:</Text>
          <Text style={styles.summaryValue}>
            {weekPlans?.filter(dp => dp.day_type === 'CARDIO_DAY').length || 0}日
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>休養日:</Text>
          <Text style={styles.summaryValue}>
            {weekPlans?.filter(dp => dp.day_type === 'REST_DAY').length || 0}日
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
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  daysContainer: {
    padding: 16,
    gap: 12,
  },
  dayCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dayCardToday: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196F3',
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
  dayTypeREST_DAY: {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2',
  },
  dayTypePlaceholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
