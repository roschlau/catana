import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {PartialBy} from '../../util/types'
import {isSameView, NodeView} from '@/common/node-views'
import {Selection} from '../../util/selection'
import {useAppDispatch, useAppSelector} from '../hooks'
import {useEffect} from 'react'
import {ROOT_NODE} from '@/common/demoGraph'
import {Id, Node, TextNode} from '@/common/nodes'

export interface UndoableUiState {
  openedNode: Id<'node'> | null
  workspaceDirty: false,
}

export interface EphemeralUiState {
  nodeGraphPath: string | null
  debugMode: boolean
  commandFocus?: {
    nodeView: NodeView<TextNode>
    selection: Selection,
  }
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
  nodeView: NodeView<Node>
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
      nodeView: NodeView<Node>,
      selection: PartialBy<Selection, 'end'>
    }>) => {
      state.focusRestoreRequest = {
        ...action.payload,
        nodeView: action.payload.nodeView,
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
    },
    setCommandFocus: (state, action: PayloadAction<EphemeralUiState['commandFocus']>) => {
      state.commandFocus = action.payload
    },
  },
})

export const { nodeOpened } = undoableUiSlice.actions
export const { focusRestoreRequested, focusRestored, debugModeSet, setCommandFocus } = ephemeralUiSlice.actions

export const selectPreparedFocusRestore = (state: { ui: EphemeralUiState }) => state.ui.focusRestoreRequest
export const selectDebugMode = (state: { ui: EphemeralUiState }) => state.ui.debugMode
export const selectCommandFocus = (state: { ui: EphemeralUiState }) => state.ui.commandFocus

/**
 * Calls `focus` as an effect if a focus restore has been requested for the passed nodeView.
 */
export function useFocusRestore(
  nodeView: NodeView<Node>,
  focus: (selection: Selection) => void,
) {
  const preparedFocusRestore = useAppSelector(selectPreparedFocusRestore)
  const dispatch = useAppDispatch()
  useEffect(() => {
    if (preparedFocusRestore) {
      const { nodeView: focusNodeView, selection: focusSelection } = preparedFocusRestore
      if (isSameView(focusNodeView, nodeView)) {
        focus(focusSelection)
        dispatch(focusRestored())
      }
    }
  }, [preparedFocusRestore, dispatch, nodeView, focus])
}
