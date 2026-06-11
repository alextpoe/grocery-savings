import { SupabaseProvider } from '@grocery-savings/api/hooks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { Provider as JotaiProvider } from 'jotai'
import { useEffect } from 'react'
import { TamaguiProvider } from 'tamagui'

import { AuthProvider } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

import { config } from '../tamagui.config'


// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after initialization
    SplashScreen.hideAsync()
  }, [])

  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider value={supabase}>
          <TamaguiProvider config={config}>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </AuthProvider>
          </TamaguiProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </JotaiProvider>
  )
}
