import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createDrawerNavigator } from '@react-navigation/drawer'
import TodayScreen from '../screens/TodayScreen'
import ShoppingListScreen from '../screens/ShoppingListScreen'

const Drawer = createDrawerNavigator()

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          drawerActiveTintColor: '#4CAF50',
        }}
      >
        <Drawer.Screen
          name="Today"
          component={TodayScreen}
          options={{ title: '今日' }}
        />
        <Drawer.Screen
          name="ShoppingList"
          component={ShoppingListScreen}
          options={{ title: '買い物リスト' }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  )
}

