import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShoppingList } from '@/hooks/useShoppingList';
import { ShoppingListComponent } from '@/components/ShoppingList';
import { TopRightMenu } from '@/components/TopRightMenu';
import { ScreenLoader } from '@/components/ScreenLoader';

export default function ShoppingListScreen() {
  const { data: shoppingList, isLoading } = useShoppingList();

  if (isLoading) {
    return <ScreenLoader />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <TopRightMenu />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>今週の買い物リスト</Text>
          <Text style={styles.subtitle}>
            {shoppingList?.week_start_date && shoppingList?.week_end_date
              ? `${shoppingList.week_start_date} 〜 ${shoppingList.week_end_date}`
              : '今週（月〜日）'}
          </Text>
        </View>
        <ShoppingListComponent shoppingList={shoppingList} />
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
});

