import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

const categoryNames: Record<string, string> = {
  PROTEIN: 'タンパク',
  VEGETABLE: '野菜',
  CARB: '糖質',
  OTHER: 'その他',
}

export default function ShoppingListScreen() {
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['shopping-list'],
    queryFn: () => api.getShoppingList(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ itemId, purchased }: { itemId: string; purchased: boolean }) =>
      api.updateShoppingListItem(itemId, purchased),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>エラーが発生しました</Text>
        <Text style={styles.errorSubText}>{String(error)}</Text>
      </View>
    )
  }

  if (!data) {
    return (
      <View style={styles.centerContainer}>
        <Text>データがありません</Text>
      </View>
    )
  }

  const categories = Object.entries(data.items).filter(([_, items]) => items.length > 0)

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>今週の買い物リスト</Text>
        <Text style={styles.weekRange}>
          {data.weekStart} 〜 {data.weekEnd}
        </Text>
      </View>

      {categories.map(([category, items]: [string, any[]]) => (
        <View key={category} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{categoryNames[category] || category}</Text>
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.listItem}
              onPress={() =>
                updateMutation.mutate({ itemId: item.id, purchased: !item.purchased })
              }
            >
              <View style={[styles.checkbox, item.purchased && styles.checkboxChecked]}>
                {item.purchased && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.itemContent}>
                <Text
                  style={[
                    styles.itemName,
                    item.purchased && styles.itemNameCompleted,
                  ]}
                >
                  {item.ingredientName}
                </Text>
                <Text style={styles.itemQuantity}>
                  {item.quantity}
                  {item.unit}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      {categories.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>今週の食材リストがありません</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  weekRange: {
    fontSize: 14,
    color: '#666',
  },
  categorySection: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorSubText: {
    fontSize: 14,
    color: '#666',
  },
})

