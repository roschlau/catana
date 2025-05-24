import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {PartialBy} from '../../util/types'

interface FocusRestoreRequest {
  nodeId: string
  selectionStart: number
  selectionEnd: number
}

export interface UiState {
  focusRestoreRequest?: FocusRestoreRequest
}

export const uiSlice = createSlice({
  name: 'ui',
  initialState: {} as UiState,
  reducers: {
    focusRestoreRequested: (state, action: PayloadAction<PartialBy<FocusRestoreRequest, 'selectionEnd'>>) => {
      state.focusRestoreRequest = {
        ...action.payload,
        selectionEnd: action.payload.selectionEnd ?? action.payload.selectionStart,
      }
    },
    focusRestored: (state) => {
      state.focusRestoreRequest = undefined
    },
  },
})

export const { focusRestoreRequested, focusRestored } = uiSlice.actions

export const selectPreparedFocusRestore = (state: { ui: UiState }) => state.ui.focusRestoreRequest
