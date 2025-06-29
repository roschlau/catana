import {ReactNode} from 'react'
import {twMerge} from 'tailwind-merge'


/**
 * Renders a list item.
 * Expects two children to serve as enumerator (bullet, chevron, icon, ...) and content of a list item, respectively
 */
export function ListItem({ className, children }: {
  className?: string,
  children: ReactNode,
}) {
  return (<div className={twMerge('flex flex-row gap-1.5 items-start py-0.5', className)}>{children}</div>)
}
