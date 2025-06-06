import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {PartialBy} from '../../util/types'
import {DocView, isSameView} from '../../../common/doc-views'
import {Selection} from '../nodes/thunks'
import {useAppDispatch, useAppSelector} from '../hooks'
import {useEffect} from 'react'
import {ROOT_NODE} from '../nodes/demoGraph'
import {Doc, Id} from '@/common/docs'

export interface UndoableUiState {
  rootNode: Id<'node'>
}

/**
 * All parts of UI state that should be captured in global undo history
 */
export const undoableUiSlice = createSlice({
  name: 'ui',
  initialState: { rootNode: ROOT_NODE } as UndoableUiState,
  reducers: {
    rootNodeSet: (state, action: PayloadAction<{ nodeId: Id<'node'> }>) => {
      state.rootNode = action.payload.nodeId
    },
  },
})

export interface EphemeralUiState {
  focusRestoreRequest?: FocusRestoreRequest
}

interface FocusRestoreRequest {
  nodeRef: DocView<Doc>
  selection: Selection
}

/**
 * All parts of UI state that should _not_ be captured in global undo history
 */
export const ephemeralUiSlice = createSlice({
  name: 'ui',
  initialState: {} as EphemeralUiState,
  reducers: {
    focusRestoreRequested: (state, action: PayloadAction<{
      nodeRef: DocView<Doc>,
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
  },
})

export const { rootNodeSet } = undoableUiSlice.actions
export const { focusRestoreRequested, focusRestored } = ephemeralUiSlice.actions

export const selectPreparedFocusRestore = (state: { ui: EphemeralUiState }) => state.ui.focusRestoreRequest

/**
 * Calls `focus` as an effect if a focus restore has been requested for the passed nodeRef.
 */
export function useFocusRestore(
  nodeRef: DocView<Doc>,
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
