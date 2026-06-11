import { createTamagui } from 'tamagui'
import { createInterFont } from '@tamagui/font-inter'
import { shorthands } from '@tamagui/shorthands'
import { themes, tokens } from '@tamagui/themes'
import { createMedia } from '@tamagui/react-native-media-driver'

import {
  colors,
  lightTheme,
  darkTheme,
} from '@grocery-savings/ui-tokens/colors'
import { spacingNumeric } from '@grocery-savings/ui-tokens/spacing'
import { fontSizeNumeric } from '@grocery-savings/ui-tokens/typography'
import { radiusNumeric } from '@grocery-savings/ui-tokens/radius'

const headingFont = createInterFont({
  size: fontSizeNumeric,
  weight: {
    4: '300',
    6: '500',
    7: '600',
    8: '700',
  },
})

const bodyFont = createInterFont({
  size: fontSizeNumeric,
  weight: {
    4: '300',
    6: '500',
  },
})

/**
 * Custom tokens mapped from design tokens
 */
const customTokens = {
  ...tokens,
  color: {
    ...tokens.color,
    ...colors.brand,
    ...colors.neutral,
  },
  space: {
    ...tokens.space,
    ...spacingNumeric,
  },
  radius: {
    ...tokens.radius,
    ...radiusNumeric,
  },
}

/**
 * Custom themes mapped from design tokens
 */
const customThemes = {
  light: {
    ...themes.light,
    background: lightTheme.background,
    color: lightTheme.foreground,
    backgroundPress: colors.neutral[100],
    borderColor: lightTheme.border,
    placeholderColor: lightTheme.muted.foreground,
  },
  dark: {
    ...themes.dark,
    background: darkTheme.background,
    color: darkTheme.foreground,
    backgroundPress: colors.neutral[800],
    borderColor: darkTheme.border,
    placeholderColor: darkTheme.muted.foreground,
  },
}

export const config = createTamagui({
  defaultFont: 'body',
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  tokens: customTokens,
  themes: customThemes,
  shorthands,
  media: createMedia({
    sm: { maxWidth: 640 },
    md: { maxWidth: 768 },
    lg: { maxWidth: 1024 },
    xl: { maxWidth: 1280 },
  }),
})

export default config

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
