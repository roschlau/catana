import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {PartialBy} from '../../util/types'
import {NodeReference} from '../../../common/nodeGraphModel'
import {Selection} from '../nodes/thunks'

interface FocusRestoreRequest {
  nodeRef: NodeReference
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
      nodeRef: NodeReference,
      selection: PartialBy<Selection, 'end'>
    }>) => {
      console.log('Reqesting focus', action)
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
