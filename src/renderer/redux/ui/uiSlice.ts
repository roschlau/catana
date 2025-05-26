import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {PartialBy} from '../../util/types'
import {isSameView, NodeView} from '../../../common/nodeGraphModel'
import {Selection} from '../nodes/thunks'
import {useAppDispatch, useAppSelector} from '../hooks'
import {useEffect} from 'react'

interface FocusRestoreRequest {
  nodeRef: NodeView
  selection: Selection
}

export interface UiState {
  focusRestoreRequest?: FocusRestoreRequest
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState: {} as UiState,
  reducers: {
    focusRestoreRequested: (state, action: PayloadAction<{
      nodeRef: NodeView,
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

export const { focusRestoreRequested, focusRestored } = uiSlice.actions

export const selectPreparedFocusRestore = (state: { ui: UiState }) => state.ui.focusRestoreRequest

/**
 * Calls `focus` as an effect if a focus restore has been requested for the passed nodeRef.
 */
export function useFocusRestore(
  nodeRef: NodeView,
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
