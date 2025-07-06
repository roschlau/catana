// Already a separate type to enable property-backed checkboxes as well in the future
import {CheckedState} from '@radix-ui/react-checkbox'
import {AppCommand} from '@/renderer/commands/app-command'
import {CopyCheckIcon} from 'lucide-react'
import {checkboxUpdated} from '@/renderer/redux/nodes/nodesSlice'
import {getNode} from '@/renderer/redux/nodes/helpers'

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

export const cycleCheckboxStateCommand: AppCommand = {
  name: 'Cycle Checkbox State',
  icon: <CopyCheckIcon/>,
  additionalSearchTerms: 'task doing done',
  shortcut: 'Ctrl + Enter',
  canActivate: ({focus}) => !!focus,
  thunkCreator: ({focus}) => (dispatch, getState) => {
    if (!focus) {
      throw Error('cycleCheckboxStateCommand called without focused node')
    }
    const node = getNode(getState().undoable.present.nodes, focus.nodeView.nodeId)
    const cycledState = cycleCheckboxState(node.checkbox)
    dispatch(checkboxUpdated({nodeId: node.id, state: cycledState }))
  },
}
