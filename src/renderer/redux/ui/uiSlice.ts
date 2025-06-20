import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {PartialBy} from '../../util/types'
import {isSameView, NodeView} from '@/common/node-views'
import {Selection} from '../nodes/thunks'
import {useAppDispatch, useAppSelector} from '../hooks'
import {useEffect} from 'react'
import {ROOT_NODE} from '@/common/demoGraph'
import {Id, Node} from '@/common/nodes'

export interface UndoableUiState {
  openedNode: Id<'node'> | null
  workspaceDirty: false,
}

export interface EphemeralUiState {
  nodeGraphPath: string | null
  debugMode: boolean
  focusRestoreRequest?: FocusRestoreRequest
}

/**
 * All parts of UI state that should be captured in global undo history
 */
export const undoableUiSlice = createSlice({
  name: 'ui',
  initialState: {
    openedNode: ROOT_NODE,
    workspaceDirty: false,
  } satisfies UndoableUiState as UndoableUiState,
  reducers: {
    nodeOpened: (state, action: PayloadAction<{ nodeId: Id<'node'> | null }>) => {
      state.openedNode = action.payload.nodeId
    },
  },
})

interface FocusRestoreRequest {
  nodeRef: NodeView<Node>
  selection: Selection
}

/**
 * All parts of UI state that should _not_ be captured in global undo history
 */
export const ephemeralUiSlice = createSlice({
  name: 'ui',
  initialState: {
    nodeGraphPath: null,
    debugMode: true,
  } satisfies EphemeralUiState as EphemeralUiState,
  reducers: {
    focusRestoreRequested: (state, action: PayloadAction<{
      nodeRef: NodeView<Node>,
      selection: PartialBy<Selection, 'end'>
    }>) => {
      state.focusRestoreRequest = {
        ...action.payload,
        nodeRef: action.payload.nodeRef,
        selection: {
          ...action.payload.selection,
          end: action.payload.selection.end ?? action.payload.selection.start,
        },
      }
    },
    focusRestored: (state) => {
      state.focusRestoreRequest = undefined
    },
    debugModeSet: (state, action: PayloadAction<boolean>) => {
      state.debugMode = action.payload
    }
  },
})

export const { nodeOpened } = undoableUiSlice.actions
export const { focusRestoreRequested, focusRestored, debugModeSet } = ephemeralUiSlice.actions

export const selectPreparedFocusRestore = (state: { ui: EphemeralUiState }) => state.ui.focusRestoreRequest
export const selectDebugMode = (state: { ui: EphemeralUiState }) => state.ui.debugMode

/**
 * Calls `focus` as an effect if a focus restore has been requested for the passed nodeRef.
 */
export function useFocusRestore(
  nodeRef: NodeView<Node>,
  focus: (selection: Selection) => void,
) {
  const preparedFocusRestore = useAppSelector(selectPreparedFocusRestore)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (preparedFocusRestore) {
      const { nodeRef: focusNodeRef, selection: focusSelection } = preparedFocusRestore
      if (isSameView(focusNodeRef, nodeRef)) {
        focus(focusSelection)
        dispatch(focusRestored())
      }
    }
  }, [preparedFocusRestore, dispatch, nodeRef, focus])
}
