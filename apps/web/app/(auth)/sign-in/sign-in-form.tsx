'use client'

import { useSignIn } from '@grocery-savings/api/hooks'
import { Button, Input, Label } from '@grocery-savings/ui-web'
import { signInSchema, type SignInInput } from '@grocery-savings/utils/schemas'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/dashboard'

  const [formData, setFormData] = useState<SignInInput>({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Partial<SignInInput>>({})

  const signIn = useSignIn({
    onSuccess: () => {
      router.push(redirect)
      router.refresh()
    },
    onError: (error) => {
      setErrors({ email: error.message })
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const result = signInSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Partial<SignInInput> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof SignInInput
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    signIn.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          disabled={signIn.isPending}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, password: e.target.value }))
          }
          disabled={signIn.isPending}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={signIn.isPending}>
        {signIn.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
    </form>
  )
}
