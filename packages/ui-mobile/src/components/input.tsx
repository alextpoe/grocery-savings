import { styled, Input as TamaguiInput, GetProps } from 'tamagui'

export const Input = styled(TamaguiInput, {
  name: 'Input',
  backgroundColor: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  borderRadius: '$lg',
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  color: '$color',
  placeholderTextColor: '$placeholderColor',

  focusStyle: {
    borderColor: '$brand500',
    borderWidth: 2,
  },

  variants: {
    size: {
      sm: {
        height: 40,
        fontSize: 14,
      },
      md: {
        height: 48,
        fontSize: 16,
      },
      lg: {
        height: 56,
        fontSize: 18,
      },
    },

    error: {
      true: {
        borderColor: '$error500',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
})

export type InputProps = GetProps<typeof Input>
