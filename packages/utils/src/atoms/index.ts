import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

/**
 * Theme atom
 * Persists to localStorage on web, AsyncStorage on mobile
 */
export type Theme = 'light' | 'dark' | 'system'

export const themeAtom = atomWithStorage<Theme>('theme', 'system')

/**
 * Sidebar state (for dashboard layouts)
 */
export const sidebarOpenAtom = atomWithStorage('sidebar-open', true)
export const sidebarCollapsedAtom = atomWithStorage('sidebar-collapsed', false)

/**
 * Auth state (non-persisted, managed by Supabase)
 */
export interface User {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
}

export const userAtom = atom<User | null>(null)
export const isAuthenticatedAtom = atom((get) => get(userAtom) !== null)

/**
 * Loading states
 */
export const globalLoadingAtom = atom(false)

/**
 * Toast/notification state
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

export const toastsAtom = atom<Toast[]>([])

export const addToastAtom = atom(null, (get, set, toast: Omit<Toast, 'id'>) => {
  const id = crypto.randomUUID()
  const newToast = { ...toast, id }
  set(toastsAtom, [...get(toastsAtom), newToast])

  // Auto-remove after duration
  const duration = toast.duration ?? 5000
  setTimeout(() => {
    set(toastsAtom, (toasts) => toasts.filter((t) => t.id !== id))
  }, duration)
})

export const removeToastAtom = atom(null, (get, set, id: string) => {
  set(toastsAtom, (toasts) => toasts.filter((t) => t.id !== id))
})
