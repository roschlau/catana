
// Already a separate type to enable property-backed checkboxes as well in the future
export type CheckboxConfig = IntrinsicCheckboxConfig

export type IntrinsicCheckboxConfig = {
  type: 'intrinsic'
  state: CheckboxState
}
export type CheckboxState = 'checked' | 'unchecked'

export function cycleCheckboxState(prevState: CheckboxState | undefined): CheckboxState | undefined {
  switch (prevState) {
    case undefined:
      return 'unchecked'
    case 'checked':
      return undefined
    case 'unchecked':
      return 'checked'
  }
}
