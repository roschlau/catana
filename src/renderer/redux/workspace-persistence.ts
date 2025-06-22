import {RootState, undoableReducers} from '@/renderer/redux/store'
import {SaveFile} from '@/main/nodegraph-file-schema'
import {Node} from '@/common/nodes'
import {createAction, PayloadAction, Reducer, UnknownAction} from '@reduxjs/toolkit'
import {OpenNodeGraphResult} from '@/preload/catana-api'

export const workspaceLoaded = createAction<OpenNodeGraphResult>('root/workspaceLoaded')

/**
 * Creates a reducer that will load a saved workspace and replace the current state with it.
 */
export const createWorkspaceRootReducer = (reducer: Reducer) => {
  return (state: RootState | undefined, action: UnknownAction): RootState => {
    if (action.type === workspaceLoaded.type) {
      const saveFile = (action as PayloadAction<OpenNodeGraphResult>).payload
      const nodes: SaveFile['nodes'] = saveFile.content.nodes
      const nodesById = nodes.reduce((acc, node) => ({
        ...acc,
        [node.id]: node,
      }), {} as Partial<Record<string, Node>>)

      return {
        ui: {
          nodeGraphPath: saveFile.path,
          debugMode: saveFile.content.debugMode ?? false,
        },
        undoable: {
          past: [],
          present: {
            ui: {
              openedNode: saveFile.content.openedNode,
              workspaceDirty: false,
            },
            nodes: nodesById,
          },
          future: [],
        },
      }
    }
    return reducer(state, action)
  }
}

export const markWorkspaceClean = createAction('root/markWorkspaceClean')

export const trackWorkspaceDirtyState = (reducer: Reducer) => {
  // TODO I feel like this reducer could probably be implemented more elegantly. It mostly bugs me that `workspaceDirty`
  //  lives in the nested ui state, rather than being its own top-level (relative to this reducer) field.
  return (state: ReturnType<typeof undoableReducers> | undefined, action: UnknownAction): ReturnType<typeof undoableReducers> => {
    const newState = reducer(state, action)
    if (action.type === markWorkspaceClean.type) {
      return {
        ...newState,
        ui: {
          ...newState.ui,
          workspaceDirty: false,
        },
      }
    }
    if (newState === state) {
      return newState
    }
    return {
      ...newState,
      ui: {
        ...newState.ui,
        workspaceDirty: true,
      },
    }
  }
}

export const selectWorkspaceDirty = (state: RootState) => state.undoable.present.ui.workspaceDirty
