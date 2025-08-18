import {combineReducers, configureStore} from '@reduxjs/toolkit'
import {
  nodeExpandedChanged,
  nodeIndexChanged,
  nodesSlice,
  titleUpdated,
} from '@/renderer/features/node-graph/nodes-slice'
import undoable from 'redux-undo'
import {ephemeralUiSlice} from '@/renderer/features/ui/uiSlice'
import {getUndoTransactionKey} from './undoTransactions'

import {
  createWorkspaceRootReducer,
  trackWorkspaceDirtyState,
  workspaceSlice,
} from '@/renderer/features/workspace/workspace-slice'
import {navigationSlice, nodeOpened} from '@/renderer/features/navigation/navigation-slice'
import {tagsSlice} from '@/renderer/features/tags/tags-slice'

export const undoableReducers = combineReducers({
  nodes: nodesSlice.reducer,
  tags: tagsSlice.reducer,
  workspace: workspaceSlice.reducer,
  navigation: navigationSlice.reducer,
})

export type UndoableState = ReturnType<typeof undoableReducers>

const undoableRootReducer = undoable(
  trackWorkspaceDirtyState(
    undoableReducers,
  ), {
    groupBy: (action) => {
      const transactionKey = getUndoTransactionKey(action)
      if (transactionKey) {
        // If we have an explicit transaction, then that overrules any other grouping behavior.
        return transactionKey
      }
      if (action.type === nodeOpened.type) {
        // Navigation actions are undone all together.
        return action.type
      }
      const groupPerNode: string[] = [titleUpdated.type, nodeIndexChanged.type, nodeExpandedChanged.type]
      return groupPerNode.includes(action.type)
        ? action.type + '/' + (action.payload as { nodeId: string }).nodeId
        : null
    },
  })

const workspaceState = combineReducers({
  undoable: undoableRootReducer,
  ui: ephemeralUiSlice.reducer,
})

const rootReducer = createWorkspaceRootReducer(workspaceState)

export const store = configureStore({
  reducer: rootReducer,
})

export type AppState = ReturnType<typeof workspaceState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
