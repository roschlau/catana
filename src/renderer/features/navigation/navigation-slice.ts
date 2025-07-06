import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {Id} from '@/common/nodes'

export interface NavigationState {
  openedNode: Id<'node'> | null
  backStack: Id<'node'>[]
  forwardStack: Id<'node'>[]
}

export const navigationSlice = createSlice({
  name: 'navigation',
  initialState: {
    openedNode: null,
    backStack: [],
    forwardStack: [],
  } satisfies NavigationState as NavigationState,
  reducers: {
    nodeOpened: (state, action: PayloadAction<{ nodeId: Id<'node'> | null }>) => {
      if (state.openedNode) {
        state.backStack.push(state.openedNode)
      }
      state.forwardStack = []
      state.openedNode = action.payload.nodeId
    },
    navigatedBack: (state) => {
      if (state.backStack.length > 0) {
        if (state.openedNode) {
          state.forwardStack.push(state.openedNode)
        }
        state.openedNode = state.backStack.pop()!
      }
    },
    navigatedForward: (state) => {
      if (state.forwardStack.length > 0) {
        if (state.openedNode) {
          state.backStack.push(state.openedNode)
        }
        state.openedNode = state.forwardStack.pop()!
      }
    },
  }
})

export const {
  nodeOpened,
  navigatedBack,
  navigatedForward,
} = navigationSlice.actions
