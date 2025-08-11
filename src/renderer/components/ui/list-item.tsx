import React, {ReactNode} from 'react'
import {twMerge} from 'tailwind-merge'


/**
 * Renders a list item.
 * Expects two children to serve as enumerator (bullet, chevron, icon, ...) and content of a list item, respectively
 */
export function ListItem({ className, children, ...props }: {
  className?: string,
  children: ReactNode,
} & React.ComponentProps<'div'>) {
  return (
    <div
      className={twMerge('flex flex-row gap-1.5 items-start', className)}
      {...props}
    >
      {children}
    </div>
  )
}
