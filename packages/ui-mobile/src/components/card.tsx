import { styled, YStack, GetProps } from 'tamagui'

export const Card = styled(YStack, {
  name: 'Card',
  backgroundColor: '$background',
  borderRadius: '$xl',
  borderWidth: 1,
  borderColor: '$borderColor',
  padding: 16,
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,

  variants: {
    variant: {
      elevated: {
        shadowOpacity: 0.1,
        shadowRadius: 12,
        borderWidth: 0,
      },
      outline: {
        shadowOpacity: 0,
        borderWidth: 1,
      },
      ghost: {
        borderWidth: 0,
        shadowOpacity: 0,
        backgroundColor: 'transparent',
      },
    },

    pressable: {
      true: {
        pressStyle: {
          opacity: 0.9,
          scale: 0.98,
        },
      },
    },
  } as const,

  defaultVariants: {
    variant: 'outline',
  },
})

export const CardHeader = styled(YStack, {
  name: 'CardHeader',
  gap: 4,
  paddingBottom: 12,
})

export const CardContent = styled(YStack, {
  name: 'CardContent',
  gap: 8,
})

export const CardFooter = styled(YStack, {
  name: 'CardFooter',
  paddingTop: 12,
  flexDirection: 'row',
  justifyContent: 'flex-end',
  gap: 8,
})

export type CardProps = GetProps<typeof Card>
