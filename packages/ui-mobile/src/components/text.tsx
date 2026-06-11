import { styled, Text as TamaguiText, GetProps } from 'tamagui'

export const Text = styled(TamaguiText, {
  name: 'Text',
  color: '$color',
  fontFamily: '$body',

  variants: {
    variant: {
      h1: {
        fontSize: 32,
        fontWeight: '700',
        lineHeight: 40,
        fontFamily: '$heading',
      },
      h2: {
        fontSize: 24,
        fontWeight: '600',
        lineHeight: 32,
        fontFamily: '$heading',
      },
      h3: {
        fontSize: 20,
        fontWeight: '600',
        lineHeight: 28,
        fontFamily: '$heading',
      },
      h4: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 24,
        fontFamily: '$heading',
      },
      body: {
        fontSize: 16,
        fontWeight: '400',
        lineHeight: 24,
      },
      bodySmall: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
      },
      caption: {
        fontSize: 12,
        fontWeight: '400',
        lineHeight: 16,
        color: '$placeholderColor',
      },
      label: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
      },
    },

    muted: {
      true: {
        color: '$placeholderColor',
      },
    },

    center: {
      true: {
        textAlign: 'center',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'body',
  },
})

export type TextProps = GetProps<typeof Text>
