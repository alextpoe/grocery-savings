import { styled, Button as TamaguiButton, GetProps } from 'tamagui'

export const Button = styled(TamaguiButton, {
  name: 'Button',
  pressStyle: {
    opacity: 0.8,
    scale: 0.98,
  },

  variants: {
    variant: {
      default: {
        backgroundColor: '$brand600',
        color: 'white',
      },
      secondary: {
        backgroundColor: '$neutral100',
        color: '$neutral900',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
        color: '$color',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$color',
        pressStyle: {
          backgroundColor: '$backgroundPress',
        },
      },
      destructive: {
        backgroundColor: '$error600',
        color: 'white',
      },
    },

    size: {
      sm: {
        height: 36,
        paddingHorizontal: 12,
        fontSize: 14,
        borderRadius: '$md',
      },
      md: {
        height: 44,
        paddingHorizontal: 16,
        fontSize: 16,
        borderRadius: '$lg',
      },
      lg: {
        height: 52,
        paddingHorizontal: 24,
        fontSize: 18,
        borderRadius: '$lg',
      },
    },

    fullWidth: {
      true: {
        width: '100%',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
})

export type ButtonProps = GetProps<typeof Button>
