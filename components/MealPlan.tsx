import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';

interface MealItem {
  id: string;
  name: string;
  calories: number | null;
  protein: number | null;
  quantity: number | null;
  unit: string | null;
}

interface MealTemplate {
  id: string;
  name: string;
  meal_type: string;
  calories: number | null;
  protein: number | null;
  meal_items: MealItem[];
}

interface MealPlanProps {
  mealPlan: Array<{
    meal_templates: MealTemplate;
  }>;
}

const mealTypeLabels: Record<string, string> = {
  BREAKFAST: '朝食',
  LUNCH: '昼食',
  SNACK: '間食',
  POST_WORKOUT: 'トレ後',
  DINNER: '夕食',
};

export function MealPlan({ mealPlan }: MealPlanProps) {
  const [openMealTypes, setOpenMealTypes] = useState<Record<string, boolean>>({});

  if (!mealPlan?.length) {
    return <Text style={styles.emptyText}>メニュー未設定</Text>;
  }

  const toggleMealType = (mealType: string) => {
    setOpenMealTypes((prev) => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
  };

  return (
    <View style={styles.container}>
      {mealPlan.map((plan, index) => {
        const template = plan.meal_templates;
        const mealTypeKey = template?.meal_type || `UNKNOWN_${index}`;
        const mealType = mealTypeLabels[template?.meal_type] || template?.name || '未分類';
        const isOpen = !!openMealTypes[mealTypeKey];
        const hasItems = !!template?.meal_items?.length;

        return (
          <View key={mealTypeKey} style={styles.mealSection}>
            <Pressable style={styles.mealHeader} onPress={() => toggleMealType(mealTypeKey)}>
              <Text style={styles.mealType}>{mealType}</Text>
              <View style={styles.headerRight}>
                {template?.calories ? <Text style={styles.mealCalories}>{template.calories}kcal</Text> : null}
                <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
              </View>
            </Pressable>
            {isOpen && (
              <View style={styles.itemsContainer}>
                {hasItems ? (
                  template!.meal_items.map((item) => (
                    <Text key={item.id} style={styles.mealItem}>
                      ・{item.name}
                      {item.quantity && item.unit && ` (${item.quantity}${item.unit})`}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.emptyText}>メニュー未設定</Text>
                )}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  mealSection: {
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  mealType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  mealCalories: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    fontSize: 12,
    color: '#666',
  },
  itemsContainer: {
    marginTop: 8,
    gap: 4,
    paddingHorizontal: 6,
  },
  mealItem: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

