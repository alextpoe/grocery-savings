'use client'

import { useUpdateProfile } from '@grocery-savings/api/hooks'
import { type Profile } from '@grocery-savings/api/types'
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@grocery-savings/ui-web'
import { profileUpdateSchema, type ProfileUpdateInput } from '@grocery-savings/utils/schemas'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'


interface ProfileFormProps {
  profile: Profile | null
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileUpdateInput>({
    fullName: profile?.full_name || '',
    avatarUrl: profile?.avatar_url || '',
  })
  const [errors, setErrors] = useState<Partial<ProfileUpdateInput>>({})
  const [success, setSuccess] = useState(false)

  const updateProfile = useUpdateProfile({
    onSuccess: () => {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    },
    onError: (error) => {
      setErrors({ fullName: error.message })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSuccess(false)

    const result = profileUpdateSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<ProfileUpdateInput> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof ProfileUpdateInput
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    if (!profile) return

    updateProfile.mutate({
      id: profile.id,
      data: {
        full_name: formData.fullName,
        avatar_url: formData.avatarUrl || null,
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your profile information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Contact support to change your email address.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={formData.fullName || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fullName: e.target.value }))
              }
              disabled={updateProfile.isPending}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              type="url"
              placeholder="https://example.com/avatar.png"
              value={formData.avatarUrl || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, avatarUrl: e.target.value }))
              }
              disabled={updateProfile.isPending}
            />
            {errors.avatarUrl && (
              <p className="text-sm text-destructive">{errors.avatarUrl}</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
            {success && (
              <p className="text-sm text-green-600">Profile updated!</p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
