import { Redirect, Stack } from 'expo-router'

import { useAuth } from '@/lib/auth-context'

export default function AuthLayout() {
  const { user } = useAuth()

  // Redirect authenticated users to home
  if (user) {
    return <Redirect href="/(tabs)/home" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  )
}
