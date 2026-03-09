import { useState } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { WebView } from 'react-native-webview';
import { postV1LlmExerciseReferenceVideo } from '@/lib/generated/llmApi';
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
  const [pipVisible, setPipVisible] = useState(false);
  const [pipTitle, setPipTitle] = useState('');
  const [pipUrl, setPipUrl] = useState('');
  const [pipLoadError, setPipLoadError] = useState(false);
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

  const openExerciseReference = async (exerciseName: string) => {
    try {
      const response = await postV1LlmExerciseReferenceVideo({ exerciseName });
      if (response.status !== 200) {
        throw new Error(('error' in response.data && response.data.error) ? response.data.error : '動画の取得に失敗しました');
      }
      setPipTitle(response.data.title || exerciseName);
      setPipUrl(response.data.youtubeUrl || '');
      setPipLoadError(false);
      setPipVisible(true);
    } catch (error: any) {
      const msg = typeof error?.message === 'string' ? error.message : '動画の取得に失敗しました';
      Alert.alert('動画取得エラー', msg);
    }
  };

  const openInYouTube = async () => {
    const match = pipUrl.match(/\/embed\/([A-Za-z0-9_-]{11})/);
    const videoId = match?.[1];
    if (!videoId) return;
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const supported = await Linking.canOpenURL(watchUrl);
    if (supported) {
      await Linking.openURL(watchUrl);
      return;
    }
    Alert.alert('エラー', 'YouTubeを開けませんでした');
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
          <WorkoutPlan workoutPlan={workoutPlan} onPressReference={openExerciseReference} />
        </View>
      )}
      </ScrollView>
      {pipVisible && !!pipUrl && (
        <View style={styles.pipContainer}>
          <View style={styles.pipHeader}>
            <Text style={styles.pipTitle}>{pipTitle ? `${pipTitle} 参考` : '参考'}</Text>
            <TouchableOpacity onPress={() => {
              setPipVisible(false);
              setPipLoadError(false);
            }}>
              <Text style={styles.pipCloseText}>閉じる</Text>
            </TouchableOpacity>
          </View>
          {pipLoadError ? (
            <View style={styles.pipErrorContainer}>
              <Text style={styles.pipErrorText}>埋め込み再生できない動画です</Text>
              <TouchableOpacity style={styles.openYoutubeButton} onPress={openInYouTube}>
                <Text style={styles.openYoutubeButtonText}>YouTubeで開く</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              source={{ uri: pipUrl }}
              allowsInlineMediaPlayback
              allowsFullscreenVideo
              mediaPlaybackRequiresUserAction={false}
              style={styles.pipWebView}
              onError={() => setPipLoadError(true)}
              onHttpError={() => setPipLoadError(true)}
            />
          )}
        </View>
      )}
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
  pipContainer: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 240,
    height: 200,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  pipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  pipCloseText: {
    fontSize: 12,
    color: '#ef6b3b',
    fontWeight: '700',
  },
  pipWebView: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  pipErrorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pipErrorText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '600',
  },
  openYoutubeButton: {
    backgroundColor: '#ef6b3b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  openYoutubeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});

