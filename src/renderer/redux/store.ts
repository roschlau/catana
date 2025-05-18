import {configureStore} from '@reduxjs/toolkit'
import nodesReducer, {titleUpdated} from './nodes/nodesSlice'
import undoable from 'redux-undo'


export const store = configureStore({
  reducer: {
    nodes: undoable(nodesReducer, {
      groupBy: (action) => action.type === titleUpdated.type
        ? action.type + '/' + (action.payload as any).nodeId
        : null,
    }),
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
