import React from 'react'
import {Slot} from '@radix-ui/react-slot'
import {cn} from '@/renderer/util/tailwind'

export function PageTitle({
  asChild = false,
  className,
  ...props
}: React.ComponentProps<'h1'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'h1'
  return <Comp
    className={cn('font-medium text-3xl', className)}
    {...props}
  />
}
