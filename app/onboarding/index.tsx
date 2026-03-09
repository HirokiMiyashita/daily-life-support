import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getOnboardingDraft, saveOnboardingDraft, SetupMode } from '@/lib/onboardingDraft';
import { OnboardingStepper } from '@/components/OnboardingStepper';
import { commonStyles } from '@/styles/common';

export default function OnboardingModeScreen() {
  const router = useRouter();
  const [setupMode, setSetupMode] = useState<SetupMode | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }
      const draft = await getOnboardingDraft();
      setSetupMode(draft.setupMode);
    };
    init();
  }, [router]);

  const handleNext = async () => {
    if (!setupMode) return;

    await saveOnboardingDraft({
      setupMode,
      aiSuggestion: '',
    });

    if (setupMode === 'AI') {
      router.push('/onboarding/profile');
      return;
    }
    router.push('/onboarding/confirm');
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={styles.content}>
        <ScrollView style={styles.scroll} contentContainerStyle={commonStyles.scrollContent}>
          <OnboardingStepper currentStep={1} setupMode={setupMode} />
          <Text style={styles.title}>はじめに設定しましょう</Text>
          <Text style={commonStyles.subtitle}>作成方法を選択してください。</Text>

          <View style={styles.section}>
            <TouchableOpacity
              style={[commonStyles.choiceButton, setupMode === 'AI' && commonStyles.choiceButtonActive]}
              onPress={() => setSetupMode('AI')}
            >
              <Text style={[commonStyles.choiceText, setupMode === 'AI' && commonStyles.choiceTextActive]}>
                AIに任せる
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[commonStyles.choiceButton, setupMode === 'SELF' && commonStyles.choiceButtonActive]}
              onPress={() => setSetupMode('SELF')}
            >
              <Text style={[commonStyles.choiceText, setupMode === 'SELF' && commonStyles.choiceTextActive]}>
                自分で作成する
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={commonStyles.footer}>
          <TouchableOpacity
            style={[commonStyles.buttonPrimary, !setupMode && commonStyles.buttonDisabled]}
            onPress={handleNext}
            disabled={!setupMode}
          >
            <Text style={commonStyles.buttonPrimaryText}>次へ</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    marginTop: 8,
  },
  section: { gap: 10 },
});
