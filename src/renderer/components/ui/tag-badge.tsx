import * as React from 'react'
import {MouseEvent} from 'react'

import {cn} from '@/renderer/util/tailwind'
import {useTheme} from 'next-themes'
import {HashIcon, XIcon} from 'lucide-react'
import {grayTagColorValues, tagColorValues} from '@/renderer/features/tags/tag-colors'

export function TagBadge({
  className,
  hue,
  children,
  onRemoveClick,
  ...props
}: React.ComponentProps<'span'> & {
  hue: number | null,
  onRemoveClick?: (e: MouseEvent) => void,
}) {
  const { resolvedTheme } = useTheme()
  const colors = hue !== null ? tagColorValues(hue, resolvedTheme) : grayTagColorValues(resolvedTheme)
  const hashtagRemoveButton = (onRemoveClick ? (
    <button
      className={'group/remove-button inline-flex items-center cursor-pointer self-stretch px-[calc(1em/4)]'}
      title={'Remove tag'}
      onClick={onRemoveClick}
    >
      <HashIcon className={'group-hover/tag:hidden group-focus/remove-button:hidden size-[1em]'}/>
      <XIcon className={'hidden group-hover/tag:block group-focus/remove-button:block size-[1em]'}/>
    </button>
  ) : (
    <span className={'inline-flex items-center self-stretch px-[calc(1em/4)]'}>
      <HashIcon className={'size-[1em]'}/>
    </span>
  ))
  return (
    <span
      style={{
        '--accent': colors.tagBackground,
        '--accent-foreground': colors.tagForeground,
      } as React.CSSProperties}
      className={cn(
        'group/tag w-fit shrink-0 overflow-hidden inline-flex items-center justify-center',
        'text-[.75em] font-medium whitespace-nowrap cursor-default',
        '[&>svg]:size-3 [&>svg]:pointer-events-none',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'transition-[color,box-shadow]',
        'rounded-[calc(1em/4)] border border-transparent bg-accent text-accent-foreground [a&]:hover:bg-accent/90',
        className,
      )}
      {...props}
    >
      {hashtagRemoveButton}
      <span className={'py-[calc(1em/12)] pe-[calc(1em/3)]'}>
        {children}
      </span>
    </span>
  )
}
