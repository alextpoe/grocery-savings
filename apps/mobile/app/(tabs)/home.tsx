import { Text, Card, CardHeader, CardContent } from '@grocery-savings/ui-mobile'
import { YStack, ScrollView } from 'tamagui'

import { useAuth } from '@/lib/auth-context'

export default function HomeScreen() {
  const { user } = useAuth()

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <YStack gap="$2">
          <Text variant="h2">Welcome back!</Text>
          <Text variant="body" muted>
            Here's an overview of your account.
          </Text>
        </YStack>

        <Card>
          <CardHeader>
            <Text variant="h4">Getting Started</Text>
          </CardHeader>
          <CardContent>
            <YStack gap="$2">
              <Text variant="body">• Complete your profile in Settings</Text>
              <Text variant="body">• Explore the app features</Text>
              <Text variant="body">• Connect with your team</Text>
            </YStack>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Text variant="h4">Your Account</Text>
          </CardHeader>
          <CardContent>
            <YStack gap="$2">
              <Text variant="bodySmall" muted>
                Email
              </Text>
              <Text variant="body">{user?.email}</Text>
            </YStack>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Text variant="h4">Quick Stats</Text>
          </CardHeader>
          <CardContent>
            <YStack flexDirection="row" gap="$4">
              <YStack flex={1} alignItems="center">
                <Text variant="h2">12</Text>
                <Text variant="caption">Tasks</Text>
              </YStack>
              <YStack flex={1} alignItems="center">
                <Text variant="h2">5</Text>
                <Text variant="caption">Projects</Text>
              </YStack>
              <YStack flex={1} alignItems="center">
                <Text variant="h2">3</Text>
                <Text variant="caption">Teams</Text>
              </YStack>
            </YStack>
          </CardContent>
        </Card>
      </YStack>
    </ScrollView>
  )
}
