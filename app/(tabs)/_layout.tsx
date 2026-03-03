import { Tabs } from 'expo-router';
import { ListChecks, Calendar, TrendingDown, ShoppingCart } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35', // オレンジ色
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
        tabBarStyle: {
          height: 80,
          paddingBottom: 2,
          paddingTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: '今日',
          tabBarIcon: ({ color, size = 24 }) => (
            <ListChecks size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="week"
        options={{
          title: '週間',
          tabBarIcon: ({ color, size = 24 }) => (
            <Calendar size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: '記録',
          tabBarIcon: ({ color, size = 24 }) => (
            <TrendingDown size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping-list"
        options={{
          title: '買物',
          tabBarIcon: ({ color, size = 24 }) => (
            <ShoppingCart size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

