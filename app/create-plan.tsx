import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CreatePlanForm } from '@/components/CreatePlanForm';
import { commonStyles } from '@/styles/common';

export default function CreatePlanScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <CreatePlanForm onComplete={() => router.replace('/(tabs)/week')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    ...commonStyles.screen,
  },
});
