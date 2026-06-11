import { Button, Input, Text, Card, CardContent } from '@grocery-savings/ui-mobile'
import { signUpSchema, type SignUpInput } from '@grocery-savings/utils/schemas'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Alert } from 'react-native'
import { YStack, ScrollView } from 'tamagui'
import { type z } from 'zod'

import { supabase } from '@/lib/supabase'

export default function SignUpScreen() {
  const [formData, setFormData] = useState<SignUpInput>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })
  const [errors, setErrors] = useState<Partial<SignUpInput>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async () => {
    setErrors({})

    const result = signUpSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<SignUpInput> = {}
      result.error.issues.forEach((issue: z.ZodIssue) => {
        const field = issue.path[0] as keyof SignUpInput
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.fullName },
      },
    })

    setIsLoading(false)

    if (error) {
      setErrors({ email: error.message })
      return
    }

    if (data.user?.confirmed_at) {
      router.replace('/(tabs)/home')
    } else {
      Alert.alert(
        'Check your email',
        'We sent a confirmation link to ' + formData.email,
        [{ text: 'OK', onPress: () => router.back() }]
      )
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} padding="$4" justifyContent="center" gap="$4">
          <YStack gap="$2" alignItems="center">
            <Text variant="h1">Create an account</Text>
            <Text variant="body" muted center>
              Enter your details to get started
            </Text>
          </YStack>

          <Card>
            <CardContent>
              <YStack gap="$4">
                <YStack gap="$2">
                  <Text variant="label">Name</Text>
                  <Input
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChangeText={(text: string) =>
                      setFormData((prev: SignUpInput) => ({ ...prev, fullName: text }))
                    }
                    editable={!isLoading}
                    error={!!errors.fullName}
                  />
                  {errors.fullName && (
                    <Text variant="caption" style={{ color: '#ef4444' }}>
                      {errors.fullName}
                    </Text>
                  )}
                </YStack>

                <YStack gap="$2">
                  <Text variant="label">Email</Text>
                  <Input
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text: string) =>
                      setFormData((prev: SignUpInput) => ({ ...prev, email: text }))
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
                    placeholder="Create a password"
                    secureTextEntry
                    value={formData.password}
                    onChangeText={(text: string) =>
                      setFormData((prev: SignUpInput) => ({ ...prev, password: text }))
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

                <YStack gap="$2">
                  <Text variant="label">Confirm Password</Text>
                  <Input
                    placeholder="Confirm your password"
                    secureTextEntry
                    value={formData.confirmPassword}
                    onChangeText={(text: string) =>
                      setFormData((prev: SignUpInput) => ({ ...prev, confirmPassword: text }))
                    }
                    editable={!isLoading}
                    error={!!errors.confirmPassword}
                  />
                  {errors.confirmPassword && (
                    <Text variant="caption" style={{ color: '#ef4444' }}>
                      {errors.confirmPassword}
                    </Text>
                  )}
                </YStack>

                <Button
                  onPress={handleSignUp}
                  disabled={isLoading}
                  fullWidth
                >
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </YStack>
            </CardContent>
          </Card>

          <YStack alignItems="center">
            <Text variant="bodySmall" muted>
              Already have an account?{' '}
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
