import { useMemo, useState } from 'react';
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

const mealCalorieRanges: Record<string, string> = {
  BREAKFAST: '200-250kcal',
  LUNCH: '500-550kcal',
  SNACK: '100-150kcal',
  POST_WORKOUT: '150-200kcal',
  DINNER: '400-450kcal',
};

export function MealPlan({ mealPlan }: MealPlanProps) {
  const mealTypeOrder = ['BREAKFAST', 'LUNCH', 'SNACK', 'POST_WORKOUT', 'DINNER'];
  const [openMealTypes, setOpenMealTypes] = useState<Record<string, boolean>>({
    BREAKFAST: true,
    LUNCH: false,
    SNACK: false,
    POST_WORKOUT: false,
    DINNER: false,
  });

  const mealPlanByType = useMemo(() => {
    const map: Record<string, MealTemplate | undefined> = {};
    mealPlan.forEach((plan) => {
      const template = plan.meal_templates;
      if (template?.meal_type) {
        map[template.meal_type] = template;
      }
    });
    return map;
  }, [mealPlan]);

  const toggleMealType = (mealType: string) => {
    setOpenMealTypes((prev) => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
  };

  return (
    <View style={styles.container}>
      {mealTypeOrder.map((mealTypeKey) => {
        const template = mealPlanByType[mealTypeKey];
        const mealType = mealTypeLabels[mealTypeKey] || mealTypeKey;
        const calorieRange = mealCalorieRanges[mealTypeKey] || '';
        const isOpen = !!openMealTypes[mealTypeKey];
        const hasItems = !!template?.meal_items?.length;

        return (
          <View key={mealTypeKey} style={styles.mealSection}>
            <Pressable style={styles.mealHeader} onPress={() => toggleMealType(mealTypeKey)}>
              <Text style={styles.mealType}>{mealType}</Text>
              <View style={styles.headerRight}>
                {calorieRange ? <Text style={styles.mealCalories}>{calorieRange}</Text> : null}
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

