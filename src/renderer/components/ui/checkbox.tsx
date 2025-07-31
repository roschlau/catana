import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import {CheckIcon, EllipsisIcon} from 'lucide-react'

import {cn} from '@/renderer/util/tailwind'

/**
 * Simple checkbox. Will adjust to the current font size to make it easy to integrate with text.
 */
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  const IndicatorIcon = props.checked === 'indeterminate' ? EllipsisIcon : CheckIcon
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer border-input dark:bg-input/30 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none size-[1em]',
        props.checked === 'indeterminate' ? 'bg-primary text-primary-foreground dark:bg-primary border-primary' : null,
        props.checked === true ? 'bg-input text-input-foreground border-input' : null,
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <IndicatorIcon className={'size-[0.875em]'}/>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export {Checkbox}
