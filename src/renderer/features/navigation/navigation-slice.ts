import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {TextNode} from '@/common/nodes'
import {Tag} from '@/common/tags'

type View =
  | { type: 'node', nodeId: TextNode['id']}
  | { type: 'tag', tagId: Tag['id']}

export interface NavigationState {
  currentView: View | null
  backStack: View[]
  forwardStack: View[]
}

export const navigationSlice = createSlice({
  name: 'navigation',
  initialState: {
    currentView: null,
    backStack: [],
    forwardStack: [],
  } satisfies NavigationState as NavigationState,
  reducers: {
    viewOpened: (state, action: PayloadAction<View | null>) => {
      if (state.currentView) {
        state.backStack.push(state.currentView)
      }
      state.forwardStack = []
      state.currentView = action.payload
    },
    navigatedBack: (state) => {
      if (state.backStack.length > 0) {
        if (state.currentView) {
          state.forwardStack.push(state.currentView)
        }
        state.currentView = state.backStack.pop()!
      }
    },
    navigatedForward: (state) => {
      if (state.forwardStack.length > 0) {
        if (state.currentView) {
          state.backStack.push(state.currentView)
        }
        state.currentView = state.forwardStack.pop()!
      }
    },
  }
})

export const {
  viewOpened,
  navigatedBack,
  navigatedForward,
} = navigationSlice.actions
