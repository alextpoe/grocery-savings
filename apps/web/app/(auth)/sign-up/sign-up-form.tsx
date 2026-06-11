'use client'

import { useSignUp } from '@grocery-savings/api/hooks'
import { Button, Input, Label } from '@grocery-savings/ui-web'
import { signUpSchema, type SignUpInput } from '@grocery-savings/utils/schemas'
import { Loader2, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SignUpForm() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignUpInput>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  })
  const [errors, setErrors] = useState<Partial<SignUpInput>>({})
  const [success, setSuccess] = useState(false)

  const signUp = useSignUp({
    onSuccess: (data) => {
      if (data.user?.confirmed_at) {
        // User confirmed, redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        // Email confirmation required
        setSuccess(true)
      }
    },
    onError: (error) => {
      setErrors({ email: error.message })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = signUpSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<SignUpInput> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignUpInput
        // Keep the FIRST issue per field — it's the most fundamental one
        fieldErrors[field] = fieldErrors[field] ?? issue.message
      })
      setErrors(fieldErrors)
      return
    }

    signUp.mutate({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      redirectTo: `${window.location.origin}/api/auth/callback`,
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center space-y-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <div>
          <h3 className="text-lg font-medium">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to {formData.email}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, fullName: e.target.value }))
          }
          disabled={signUp.isPending}
        />
        {errors.fullName && (
          <p className="text-sm text-destructive">{errors.fullName}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, email: e.target.value }))
          }
          disabled={signUp.isPending}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, password: e.target.value }))
          }
          disabled={signUp.isPending}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              confirmPassword: e.target.value,
            }))
          }
          disabled={signUp.isPending}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={signUp.isPending}>
        {signUp.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign Up
      </Button>
    </form>
  )
}
