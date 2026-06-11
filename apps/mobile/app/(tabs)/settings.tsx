import { type Profile } from '@grocery-savings/api/types'
import { Button, Input, Text, Card, CardHeader, CardContent, Avatar } from '@grocery-savings/ui-mobile'
import { getInitials } from '@grocery-savings/utils/formatters'
import { profileUpdateSchema, type ProfileUpdateInput } from '@grocery-savings/utils/schemas'
import { router } from 'expo-router'
import { useState, useEffect } from 'react'
import { Alert } from 'react-native'
import { YStack, ScrollView } from 'tamagui'
import { type z } from 'zod'

import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export default function SettingsScreen() {
  const { user } = useAuth()
  const [_profile, setProfile] = useState<Profile | null>(null)
  const [formData, setFormData] = useState<ProfileUpdateInput>({
    fullName: '',
    avatarUrl: '',
  })
  const [errors, setErrors] = useState<Partial<ProfileUpdateInput>>({})
  const [_isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .single()

    if (data) {
      setProfile(data)
      setFormData({
        fullName: data.full_name || '',
        avatarUrl: data.avatar_url || '',
      })
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setErrors({})

    const result = profileUpdateSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<ProfileUpdateInput> = {}
      result.error.issues.forEach((issue: z.ZodIssue) => {
        const field = issue.path[0] as keyof ProfileUpdateInput
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setIsSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName,
        avatar_url: formData.avatarUrl || null,
      })
      .eq('id', user!.id)

    setIsSaving(false)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    Alert.alert('Success', 'Profile updated successfully')
    loadProfile()
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
            router.replace('/(auth)/sign-in')
          },
        },
      ]
    )
  }

  const displayName = formData.fullName || user?.email || 'User'

  return (
    <ScrollView>
      <YStack padding="$4" gap="$4">
        <Card>
          <CardHeader>
            <Text variant="h4">Profile</Text>
          </CardHeader>
          <CardContent>
            <YStack gap="$4" alignItems="center">
              <Avatar
                size="xl"
                src={formData.avatarUrl || null}
                fallback={getInitials(displayName)}
              />

              <YStack gap="$2" width="100%">
                <Text variant="label">Email</Text>
                <Input
                  value={user?.email || ''}
                  editable={false}
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </YStack>

              <YStack gap="$2" width="100%">
                <Text variant="label">Full Name</Text>
                <Input
                  placeholder="John Doe"
                  value={formData.fullName || ''}
                  onChangeText={(text: string) =>
                    setFormData((prev: ProfileUpdateInput) => ({ ...prev, fullName: text }))
                  }
                  editable={!isSaving}
                  error={!!errors.fullName}
                />
                {errors.fullName && (
                  <Text variant="caption" style={{ color: '#ef4444' }}>
                    {errors.fullName}
                  </Text>
                )}
              </YStack>

              <YStack gap="$2" width="100%">
                <Text variant="label">Avatar URL</Text>
                <Input
                  placeholder="https://example.com/avatar.png"
                  value={formData.avatarUrl || ''}
                  onChangeText={(text: string) =>
                    setFormData((prev: ProfileUpdateInput) => ({ ...prev, avatarUrl: text }))
                  }
                  editable={!isSaving}
                  error={!!errors.avatarUrl}
                />
                {errors.avatarUrl && (
                  <Text variant="caption" style={{ color: '#ef4444' }}>
                    {errors.avatarUrl}
                  </Text>
                )}
              </YStack>

              <Button
                onPress={handleSave}
                disabled={isSaving}
                fullWidth
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </YStack>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Text variant="h4">Account</Text>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onPress={handleSignOut}
              fullWidth
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </YStack>
    </ScrollView>
  )
}
