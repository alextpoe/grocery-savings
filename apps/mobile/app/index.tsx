import { Redirect } from 'expo-router'
import { YStack, Spinner } from 'tamagui'

import { useAuth } from '@/lib/auth-context'

export default function Index() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" />
      </YStack>
    )
  }

  if (user) {
    return <Redirect href="/(tabs)/home" />
  }

  return <Redirect href="/(auth)/sign-in" />
}
