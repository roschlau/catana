import {configureStore} from '@reduxjs/toolkit'
import nodesReducer, {nodeIndexChanged, titleUpdated} from './nodes/nodesSlice'
import undoable from 'redux-undo'
import {uiSlice} from './ui/uiSlice'


export const store = configureStore({
  reducer: {
    nodes: undoable(nodesReducer, {
      groupBy: (action) => {
        const groupPerNode: string[] = [titleUpdated.type, nodeIndexChanged.type]
        return groupPerNode.includes(action.type)
          ? action.type + '/' + (action.payload as any).nodeId
          : null
      },
    }),
    ui: uiSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
