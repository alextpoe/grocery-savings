import { Image, XStack, Text as TamaguiText } from 'tamagui'

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string | null
  fallback: string
  size?: AvatarSize
}

const sizeConfig = {
  sm: { container: 32, radius: 16, fontSize: 12 },
  md: { container: 40, radius: 20, fontSize: 14 },
  lg: { container: 56, radius: 28, fontSize: 20 },
  xl: { container: 80, radius: 40, fontSize: 28 },
} as const

export function Avatar({ src, fallback, size = 'md' }: AvatarProps) {
  const config = sizeConfig[size]

  return (
    <XStack
      backgroundColor="$neutral200"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      width={config.container}
      height={config.container}
      borderRadius={config.radius}
    >
      {src ? (
        <Image source={{ uri: src }} width="100%" height="100%" />
      ) : (
        <TamaguiText fontSize={config.fontSize} fontWeight="600">
          {fallback}
        </TamaguiText>
      )}
    </XStack>
  )
}

export type { AvatarProps }
