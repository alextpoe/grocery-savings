/**
 * Design System Colors
 * Single source of truth for all colors across web and mobile
 */

export const colors = {
  // Brand colors
  brand: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49',
  },

  // Neutral colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
} as const

/**
 * Semantic color tokens for light theme
 */
export const lightTheme = {
  background: colors.neutral[50],
  foreground: colors.neutral[900],

  card: {
    background: '#ffffff',
    foreground: colors.neutral[900],
  },

  primary: {
    background: colors.brand[600],
    foreground: '#ffffff',
  },

  secondary: {
    background: colors.neutral[100],
    foreground: colors.neutral[900],
  },

  muted: {
    background: colors.neutral[100],
    foreground: colors.neutral[500],
  },

  accent: {
    background: colors.brand[100],
    foreground: colors.brand[700],
  },

  destructive: {
    background: colors.error[600],
    foreground: '#ffffff',
  },

  border: colors.neutral[200],
  input: colors.neutral[200],
  ring: colors.brand[500],
} as const

/**
 * Semantic color tokens for dark theme
 */
export const darkTheme = {
  background: colors.neutral[950],
  foreground: colors.neutral[50],

  card: {
    background: colors.neutral[900],
    foreground: colors.neutral[50],
  },

  primary: {
    background: colors.brand[500],
    foreground: colors.neutral[950],
  },

  secondary: {
    background: colors.neutral[800],
    foreground: colors.neutral[50],
  },

  muted: {
    background: colors.neutral[800],
    foreground: colors.neutral[400],
  },

  accent: {
    background: colors.brand[900],
    foreground: colors.brand[100],
  },

  destructive: {
    background: colors.error[700],
    foreground: colors.neutral[50],
  },

  border: colors.neutral[800],
  input: colors.neutral[800],
  ring: colors.brand[400],
} as const

export type Theme = typeof lightTheme
