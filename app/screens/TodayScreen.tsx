import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

const dayNames = ['日', '月', '火', '水', '木', '金', '土']
const dayTypeNames: Record<string, string> = {
  TRAINING_DAY: '筋トレ日',
  CARDIO_DAY: '有酸素日',
  REST_DAY: '休養日',
}

export default function TodayScreen() {
  const today = new Date().toISOString().split('T')[0]
  const { data, isLoading, error } = useQuery({
    queryKey: ['today', today],
    queryFn: () => api.getToday(today),
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

  const date = new Date(data.date)
  const dayName = dayNames[data.dayOfWeek]

  return (
    <ScrollView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.dateText}>
          {date.getMonth() + 1}月{date.getDate()}日 ({dayName})
        </Text>
        <Text style={styles.dayTypeText}>{dayTypeNames[data.dayType] || data.dayType}</Text>
      </View>

      {/* 今日のやること */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日のやること</Text>
        {data.todos.map((todo: any) => (
          <View key={todo.id} style={styles.todoItem}>
            <View style={[styles.checkbox, todo.completed && styles.checkboxChecked]}>
              {todo.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={styles.todoContent}>
              <Text style={styles.todoName}>{todo.name}</Text>
              {todo.time && <Text style={styles.todoTime}>{todo.time}</Text>}
              {todo.description && (
                <Text style={styles.todoDescription}>{todo.description}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* 今日の食事メニュー */}
      {data.meals && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日の食事メニュー</Text>
          <Text style={styles.mealTemplateName}>{data.meals.template}</Text>
          {data.meals.items.map((item: any) => (
            <View key={item.id} style={styles.mealItem}>
              <Text style={styles.mealItemName}>
                {item.name}
                {item.quantity && item.unit && ` (${item.quantity}${item.unit})`}
              </Text>
              <View style={styles.nutritionInfo}>
                {item.calories && (
                  <Text style={styles.nutritionText}>カロリー: {item.calories}kcal</Text>
                )}
                {item.protein && (
                  <Text style={styles.nutritionText}>P: {item.protein}g</Text>
                )}
                {item.fat && <Text style={styles.nutritionText}>F: {item.fat}g</Text>}
                {item.carbs && <Text style={styles.nutritionText}>C: {item.carbs}g</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 今日のジムメニュー */}
      {data.workout && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日のジムメニュー</Text>
          <Text style={styles.workoutName}>{data.workout.name}</Text>
          {data.workout.cardioMinutes && (
            <Text style={styles.cardioInfo}>
              有酸素: {data.workout.cardioMinutes}分
              {data.workout.cardioIntensity && ` (${data.workout.cardioIntensity})`}
            </Text>
          )}
          {data.workout.exercises.map((exercise: any) => (
            <View key={exercise.id} style={styles.exerciseItem}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDetail}>
                {exercise.sets}セット × {exercise.repsMin}
                {exercise.repsMax && `〜${exercise.repsMax}`}回
                {exercise.weight && ` (${exercise.weight}kg)`}
              </Text>
              {exercise.notes && (
                <Text style={styles.exerciseNotes}>{exercise.notes}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* 今日の目標 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日の目標</Text>
        <View style={styles.goalsContainer}>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>カロリー</Text>
            <Text style={styles.goalValue}>
              {data.goals.calories.min}
              {data.goals.calories.max && `〜${data.goals.calories.max}`}kcal
            </Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>タンパク質</Text>
            <Text style={styles.goalValue}>{data.goals.protein}g</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>脂質</Text>
            <Text style={styles.goalValue}>{data.goals.fat}g</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>歩数</Text>
            <Text style={styles.goalValue}>{data.goals.steps.toLocaleString()}歩</Text>
          </View>
          <View style={styles.goalItem}>
            <Text style={styles.goalLabel}>睡眠</Text>
            <Text style={styles.goalValue}>{data.goals.sleep}時間</Text>
          </View>
        </View>
      </View>
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
  dateText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dayTypeText: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  todoContent: {
    flex: 1,
  },
  todoName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  todoTime: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  todoDescription: {
    fontSize: 14,
    color: '#666',
  },
  mealTemplateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  mealItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  mealItemName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  nutritionInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutritionText: {
    fontSize: 12,
    color: '#666',
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  cardioInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  exerciseItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  exerciseDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  exerciseNotes: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  goalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalItem: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    minWidth: '45%',
  },
  goalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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

