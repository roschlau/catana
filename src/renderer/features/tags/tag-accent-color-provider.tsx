import {Slot} from '@radix-ui/react-slot'
import {useTheme} from 'next-themes'
import * as React from 'react'
import {tagColorValues} from '@/renderer/features/tags/tag-colors'

export function TagAccentColorProvider({
  hue,
  children,
} : {
  hue?: number,
  children: React.ReactNode,
}) {
  const { resolvedTheme } = useTheme()
  if (hue === undefined) {
    return children
  }
  const colors = tagColorValues(hue, resolvedTheme)
  return (
    <Slot
      style={{
        '--accent': colors.tagBackground,
        '--accent-foreground': colors.tagForeground,
      } as React.CSSProperties}
    >
      {children}
    </Slot>
  )
}
