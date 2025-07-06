import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {PartialBy} from '../../util/types'
import {isSameView, NodeView} from '@/common/node-views'
import {Selection} from '../../util/selection'
import {useAppDispatch, useAppSelector} from '../hooks'
import {useEffect} from 'react'
import {Node, TextNode} from '@/common/nodes'

export interface UndoableUiState {
  workspacePath: string | null
  workspaceDirty: boolean,
}

export interface EphemeralUiState {
  debugMode: boolean
  commandFocus?: {
    nodeView: NodeView<TextNode>
    selection: Selection,
  }
  focusRestoreRequest?: FocusRestoreRequest
  saveWorkspacePromptShown?: boolean
}

/**
 * All parts of UI state that should be captured in global undo history
 */
export const undoableUiSlice = createSlice({
  name: 'ui',
  initialState: {
    workspacePath: null,
    workspaceDirty: false,
  } satisfies UndoableUiState as UndoableUiState,
  reducers: {},
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
    saveWorkspacePromptShown: (state, action: PayloadAction<boolean>) => {
      state.saveWorkspacePromptShown = action.payload
    },
  },
})

export const {
  focusRestoreRequested,
  focusRestored,
  debugModeSet,
  setCommandFocus,
  saveWorkspacePromptShown,
} = ephemeralUiSlice.actions

export const selectPreparedFocusRestore = (state: { ui: EphemeralUiState }) => state.ui.focusRestoreRequest
export const selectDebugMode = (state: { ui: EphemeralUiState }) => state.ui.debugMode
export const selectCommandFocus = (state: { ui: EphemeralUiState }) => state.ui.commandFocus
export const selectSaveWorkspacePromptShown = (state: { ui: EphemeralUiState }) => state.ui.saveWorkspacePromptShown

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
