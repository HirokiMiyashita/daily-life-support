import { View, Text, StyleSheet } from 'react-native';

interface Ingredient {
  id: string;
  name: string;
  category: 'PROTEIN' | 'VEGETABLE' | 'CARB' | 'OTHER';
  default_unit: string;
}

interface ShoppingListItem {
  id: string;
  quantity: number;
  unit: string;
  purchased: boolean;
  ingredients: Ingredient | null;
}

interface ShoppingListProps {
  shoppingList?: {
    items?: Record<string, ShoppingListItem[]>;
  };
}

const categoryLabels: Record<string, string> = {
  PROTEIN: 'タンパク質',
  VEGETABLE: '野菜',
  CARB: '糖質',
  OTHER: 'その他',
};

export function ShoppingListComponent({ shoppingList }: ShoppingListProps) {
  if (!shoppingList?.items || Object.keys(shoppingList.items).length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>買い物リストがありません</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Object.entries(shoppingList.items).map(([category, items]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>
            {categoryLabels[category] || category}
          </Text>
          <View style={styles.itemsContainer}>
            {items.map((item) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.itemName}>
                  {item.ingredients?.name || 'Unknown'}
                </Text>
                <Text style={styles.itemQuantity}>
                  {item.quantity} {item.unit}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  categorySection: {
    gap: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemsContainer: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
});

