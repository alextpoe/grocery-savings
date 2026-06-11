'use client'

import { useResetPassword } from '@grocery-savings/api/hooks'
import { Button, Input, Label } from '@grocery-savings/ui-web'
import { forgotPasswordSchema } from '@grocery-savings/utils/schemas'
import { Loader2, CheckCircle } from 'lucide-react'
import { useState } from 'react'


export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const resetPassword = useResetPassword({
    onSuccess: () => {
      setSuccess(true)
    },
    onError: (error) => {
      setError(error.message)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = forgotPasswordSchema.safeParse({ email })
    if (!result.success) {
      setError(result.error.issues[0]?.message || 'Invalid email')
      return
    }

    resetPassword.mutate({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center space-y-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-500" />
        <div>
          <h3 className="text-lg font-medium">Check your email</h3>
          <p className="text-sm text-muted-foreground">
            We sent a password reset link to {email}
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={resetPassword.isPending}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={resetPassword.isPending}
      >
        {resetPassword.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Send Reset Link
      </Button>
    </form>
  )
}
