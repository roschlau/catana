// Already a separate type to enable property-backed checkboxes as well in the future
import {CheckedState} from '@radix-ui/react-checkbox'
import {AppCommand} from '@/renderer/commands/app-command'
import {CopyCheckIcon, CornerDownLeftIcon} from 'lucide-react'
import {checkboxUpdated} from '@/renderer/features/node-graph/nodes-slice'
import {getNode} from '@/renderer/features/node-graph/helpers'
import {CheckboxHistoryEntry} from '@/common/nodes'
import {Duration} from '@js-joda/core'

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
  shortcut: ['Ctrl', <CornerDownLeftIcon/>],
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

export const inProgressDuration = (history: CheckboxHistoryEntry[]): Duration | undefined => {
  let millisTotal = 0
  let lastStart: number | undefined = undefined
  history.toReversed().forEach(([millis, state]) => {
    if (state === 'indeterminate') {
      if (lastStart === undefined) {
        lastStart = millis
      }
    } else {
      if (lastStart !== undefined) {
        millisTotal += millis - lastStart
        lastStart = undefined
      }
    }
  })
  if (lastStart !== undefined) {
    // Task is currently open, so add the time from when it was last set to in progress until now.
    const now = Date.now()
    millisTotal += now - lastStart
  }
  if (millisTotal === 0) {
    return undefined
  }
  return Duration.ofMillis(millisTotal)
}
