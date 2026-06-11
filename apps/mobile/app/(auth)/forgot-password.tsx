import { Button, Input, Text, Card, CardContent } from '@grocery-savings/ui-mobile'
import { forgotPasswordSchema } from '@grocery-savings/utils/schemas'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { YStack, ScrollView } from 'tamagui'

import { supabase } from '@/lib/supabase'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async () => {
    setError('')

    const result = forgotPasswordSchema.safeParse({ email })
    if (!result.success) {
      setError(result.error.issues[0]?.message || 'Invalid email')
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email)

    setIsLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    Alert.alert(
      'Check your email',
      'We sent a password reset link to ' + email,
      [{ text: 'OK', onPress: () => router.back() }]
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} padding="$4" justifyContent="center" gap="$4">
          <YStack gap="$2" alignItems="center">
            <Text variant="h1">Forgot password?</Text>
            <Text variant="body" muted center>
              Enter your email and we'll send you a reset link
            </Text>
          </YStack>

          <Card>
            <CardContent>
              <YStack gap="$4">
                <YStack gap="$2">
                  <Text variant="label">Email</Text>
                  <Input
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    editable={!isLoading}
                    error={!!error}
                  />
                  {error && (
                    <Text variant="caption" style={{ color: '#ef4444' }}>
                      {error}
                    </Text>
                  )}
                </YStack>

                <Button
                  onPress={handleResetPassword}
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </YStack>
            </CardContent>
          </Card>

          <YStack alignItems="center">
            <Text variant="bodySmall" muted>
              Remember your password?{' '}
              <Link href="/(auth)/sign-in">
                <Text variant="bodySmall" style={{ color: '#0284c7' }}>
                  Sign in
                </Text>
              </Link>
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
