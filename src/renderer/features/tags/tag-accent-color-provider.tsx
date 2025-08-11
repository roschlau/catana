import {Slot} from '@radix-ui/react-slot'
import {tagColors} from '@/common/tags'
import {useTheme} from 'next-themes'
import * as React from 'react'

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
  const colors = tagColors(hue, resolvedTheme)
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
