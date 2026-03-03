import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTodoItems } from '@/hooks/useTodoItems';

interface TodoItem {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  order_index: number;
}

interface TodoListProps {
  todos: TodoItem[];
  dayPlanId?: string;
}

export function TodoList({ todos, dayPlanId }: TodoListProps) {
  const { updateTodo } = useTodoItems(dayPlanId);

  const handleToggle = (id: string, completed: boolean) => {
    updateTodo({ id, completed: !completed });
  };

  return (
    <View style={styles.container}>
      {todos.map((todo) => (
        <TouchableOpacity
          key={todo.id}
          style={styles.todoItem}
          onPress={() => handleToggle(todo.id, todo.completed)}
        >
          <View style={[styles.checkbox, todo.completed && styles.checkboxChecked]}>
            {todo.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={[styles.todoTitle, todo.completed && styles.todoCompleted]}>
            {todo.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  todoTitle: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  todoCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
});

