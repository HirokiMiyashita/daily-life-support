import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { OnboardingChoice, saveOnboardingState } from '@/lib/onboarding';

export default function OnboardingScreen() {
  const [trainingChoice, setTrainingChoice] = useState<OnboardingChoice | null>(null);
  const [mealChoice, setMealChoice] = useState<OnboardingChoice | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
      }
    };
    checkSession();
  }, [router]);

  const handleComplete = async () => {
    if (!trainingChoice || !mealChoice) {
      Alert.alert('確認', 'トレーニングと食事の選択をしてください');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザー情報を取得できませんでした');

      // users テーブルに親レコードを先に作成してから seed を実行する
      // （ingredients.user_id などが users.id を外部キー参照しているため）
      await saveOnboardingState(user.id, {
        trainingChoice,
        mealChoice,
        email: user.email ?? null,
      });

      if (trainingChoice === 'AI' || mealChoice === 'AI') {
        const { error } = await supabase.rpc('seed_user_data');
        if (error) throw error;
      }
      router.replace('/(tabs)/today');
    } catch (error: any) {
      Alert.alert('エラー', error?.message || 'オンボーディング保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const ChoiceButton = ({
    active,
    label,
    onPress,
  }: {
    active: boolean;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.choiceButton, active && styles.choiceButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>はじめに設定しましょう</Text>
        <Text style={styles.subtitle}>使い方を選ぶと、次回以降はこの画面を表示しません。</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>トレーニングメニュー</Text>
          <View style={styles.row}>
            <ChoiceButton
              label="自分で登録する"
              active={trainingChoice === 'SELF'}
              onPress={() => setTrainingChoice('SELF')}
            />
            <ChoiceButton
              label="AIに作らせる"
              active={trainingChoice === 'AI'}
              onPress={() => setTrainingChoice('AI')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>食事メニュー</Text>
          <View style={styles.row}>
            <ChoiceButton
              label="自分で登録する"
              active={mealChoice === 'SELF'}
              onPress={() => setMealChoice('SELF')}
            />
            <ChoiceButton
              label="AIに作らせる"
              active={mealChoice === 'AI'}
              onPress={() => setMealChoice('AI')}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleComplete}
          disabled={saving}
        >
          <Text style={styles.submitButtonText}>{saving ? '保存中...' : 'この内容で開始'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#222',
  },
  row: {
    gap: 10,
  },
  choiceButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  choiceButtonActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF3EE',
  },
  choiceText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  choiceTextActive: {
    color: '#FF6B35',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
