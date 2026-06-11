import { Button, Input, Text, Card, CardContent } from '@grocery-savings/ui-mobile'
import { signInSchema, type SignInInput } from '@grocery-savings/utils/schemas'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { YStack, ScrollView } from 'tamagui'
import { type z } from 'zod'

import { supabase } from '@/lib/supabase'

export default function SignInScreen() {
  const [formData, setFormData] = useState<SignInInput>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<SignInInput>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    setErrors({})

    const result = signInSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<SignInInput> = {}
      result.error.issues.forEach((issue: z.ZodIssue) => {
        const field = issue.path[0] as keyof SignInInput
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    setIsLoading(false)

    if (error) {
      setErrors({ email: error.message })
      return
    }

    router.replace('/(tabs)/home')
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} padding="$4" justifyContent="center" gap="$4">
          <YStack gap="$2" alignItems="center">
            <Text variant="h1">Welcome back</Text>
            <Text variant="body" muted center>
              Enter your email to sign in to your account
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
                    value={formData.email}
                    onChangeText={(text: string) =>
                      setFormData((prev: SignInInput) => ({ ...prev, email: text }))
                    }
                    editable={!isLoading}
                    error={!!errors.email}
                  />
                  {errors.email && (
                    <Text variant="caption" style={{ color: '#ef4444' }}>
                      {errors.email}
                    </Text>
                  )}
                </YStack>

                <YStack gap="$2">
                  <Text variant="label">Password</Text>
                  <Input
                    placeholder="Enter your password"
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(text: string) =>
                      setFormData((prev: SignInInput) => ({ ...prev, password: text }))
                    }
                    editable={!isLoading}
                    error={!!errors.password}
                  />
                  {errors.password && (
                    <Text variant="caption" style={{ color: '#ef4444' }}>
                      {errors.password}
                    </Text>
                  )}
                </YStack>

                <Link href="/(auth)/forgot-password" asChild>
                  <Text variant="bodySmall" style={{ color: '#0284c7' }}>
                    Forgot password?
                  </Text>
                </Link>

                <Button
                  onPress={handleSignIn}
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </YStack>
            </CardContent>
          </Card>

          <YStack alignItems="center">
            <Text variant="bodySmall" muted>
              Don't have an account?{' '}
              <Link href="/(auth)/sign-up">
                <Text variant="bodySmall" style={{ color: '#0284c7' }}>
                  Sign up
                </Text>
              </Link>
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
