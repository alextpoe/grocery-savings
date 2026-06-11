'use client'

import { useAvatarUrl, useSignOut } from '@grocery-savings/api/hooks'
import { type Profile } from '@grocery-savings/api/types'
import { Avatar, AvatarFallback, AvatarImage, Button } from '@grocery-savings/ui-web'
import { getInitials } from '@grocery-savings/utils/formatters'
import { type User } from '@supabase/supabase-js'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'


interface UserNavProps {
  user: User
  profile: Profile | null
}

export function UserNav({ user, profile }: UserNavProps) {
  const router = useRouter()
  const signOut = useSignOut({
    onSuccess: () => {
      router.push('/')
      router.refresh()
    },
  })

  const displayName = profile?.full_name || user.email || 'User'
  const { data: avatarUrl } = useAvatarUrl(profile?.avatar_url)

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{displayName}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut.mutate()}
        disabled={signOut.isPending}
      >
        <LogOut className="h-4 w-4" />
        <span className="sr-only">Sign out</span>
      </Button>
    </div>
  )
}
