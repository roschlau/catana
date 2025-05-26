import {combineReducers, configureStore} from '@reduxjs/toolkit'
import {nodeExpandedChanged, nodeIndexChanged, nodesSlice, titleUpdated} from './nodes/nodesSlice'
import undoable from 'redux-undo'
import {ephemeralUiSlice, undoableUiSlice} from './ui/uiSlice'
import {getUndoTransactionKey} from './undoTransactions'

const undoableStateReducer = combineReducers({
  nodes: nodesSlice.reducer,
  ui: undoableUiSlice.reducer,
})

export const store = configureStore({
  reducer: {
    undoable: undoable(undoableStateReducer, {
      groupBy: (action) => {
        const transactionKey = getUndoTransactionKey(action)
        if (transactionKey) {
          // If we have an explicit transaction, then that overrules any other grouping behavior.
          return transactionKey
        }
        const groupPerNode: string[] = [titleUpdated.type, nodeIndexChanged.type, nodeExpandedChanged.type]
        return groupPerNode.includes(action.type)
          ? action.type + '/' + (action.payload as { nodeId: string }).nodeId
          : null
      },
    }),
    ui: ephemeralUiSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
