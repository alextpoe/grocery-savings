import { Home, Settings } from '@tamagui/lucide-icons'
import { Redirect, Tabs } from 'expo-router'

import { useAuth } from '@/lib/auth-context'

export default function TabsLayout() {
  const { user, isLoading } = useAuth()

  // Redirect to auth if not logged in
  if (!isLoading && !user) {
    return <Redirect href="/(auth)/sign-in" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0284c7',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
