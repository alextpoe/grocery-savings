'use client'

import { SupabaseProvider } from '@grocery-savings/api/hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import { useState } from 'react'

import { ThemeProvider } from '@/components/theme-provider'
import { createClient } from '@/lib/supabase/client'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const [supabase] = useState(() => createClient())

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider value={supabase}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </JotaiProvider>
  )
}
