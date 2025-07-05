// Already a separate type to enable property-backed checkboxes as well in the future
import {CheckedState} from '@radix-ui/react-checkbox'

export type CheckboxState = CheckedState

export function cycleCheckboxState(prevState: CheckboxState | null | undefined): CheckboxState | null {
  switch (prevState) {
    case null:
    case undefined:
      return false
    case false:
      return 'indeterminate'
    case 'indeterminate':
      return true
    case true:
      return null
  }
}
