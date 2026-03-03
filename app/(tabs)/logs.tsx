import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDailyLog } from '@/hooks/useDailyLog';
import { useWeightHistory } from '@/hooks/useWeightHistory';
import { TopRightMenu } from '@/components/TopRightMenu';
import { ScreenLoader } from '@/components/ScreenLoader';

export default function LogsScreen() {
  const today = new Date().toISOString().split('T')[0];
  const { data: dailyLog, isLoading, updateLog } = useDailyLog(today);
  const { data: weightHistory, isLoading: historyLoading } = useWeightHistory(30);
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');

  useEffect(() => {
    if (dailyLog?.weight) {
      setWeight(dailyLog.weight.toString());
    }
    if (dailyLog?.waist) {
      setWaist(dailyLog.waist.toString());
    }
  }, [dailyLog]);

  const handleSaveWeight = async () => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      Alert.alert('エラー', '正しい体重を入力してください');
      return;
    }

    await updateLog({ weight: weightNum });
    Alert.alert('成功', '体重を記録しました');
  };

  const handleSaveWaist = async () => {
    const waistNum = parseFloat(waist);
    if (isNaN(waistNum) || waistNum <= 0) {
      Alert.alert('エラー', '正しいウエストを入力してください');
      return;
    }

    await updateLog({ waist: waistNum });
    Alert.alert('成功', 'ウエストを記録しました');
  };

  if (isLoading || historyLoading) {
    return <ScreenLoader />;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopRightMenu />
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>体重ログ（毎朝）</Text>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="体重 (kg)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
          />
          <Button title="保存" onPress={handleSaveWeight} />
        </View>
        {dailyLog?.weight && (
          <Text style={styles.currentValue}>現在: {dailyLog.weight} kg</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ウエスト（週1）</Text>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="ウエスト (cm)"
            value={waist}
            onChangeText={setWaist}
            keyboardType="decimal-pad"
          />
          <Button title="保存" onPress={handleSaveWaist} />
        </View>
        {dailyLog?.waist && (
          <Text style={styles.currentValue}>現在: {dailyLog.waist} cm</Text>
        )}
      </View>

      {weightHistory?.average7Days && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7日平均</Text>
          <Text style={styles.averageValue}>
            {weightHistory.average7Days.toFixed(1)} kg
          </Text>
          <Text style={styles.averageNote}>
            過去7日間の平均体重
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>体重履歴（過去30日）</Text>
        {weightHistory && weightHistory.logs.length > 0 ? (
          <View style={styles.historyContainer}>
            {weightHistory.logs.map((log, index) => (
              <View key={log.date} style={styles.historyItem}>
                <Text style={styles.historyDate}>{formatDate(log.date)}</Text>
                <Text style={styles.historyWeight}>{log.weight} kg</Text>
                {log.waist && (
                  <Text style={styles.historyWaist}>ウエスト: {log.waist} cm</Text>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>記録がありません</Text>
        )}
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
  section: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputGroup: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  currentValue: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  averageValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  averageNote: {
    fontSize: 14,
    color: '#666',
  },
  historyContainer: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  historyDate: {
    fontSize: 16,
    color: '#666',
    minWidth: 60,
  },
  historyWeight: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginRight: 12,
  },
  historyWaist: {
    fontSize: 14,
    color: '#999',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});
