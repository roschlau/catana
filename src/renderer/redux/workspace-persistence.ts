import {AppState, UndoableState} from '@/renderer/redux/store'
import {SaveFile} from '@/main/persistence/schema/workspace-file-schema'
import {Node} from '@/common/nodes'
import {createAction, PayloadAction, Reducer, UnknownAction} from '@reduxjs/toolkit'
import {OpenWorkspaceResult} from '@/preload/catana-api'

export const workspaceLoaded = createAction<OpenWorkspaceResult>('root/workspaceLoaded')

/**
 * Creates a reducer that will load a saved workspace and replace the current state with it.
 */
export const createWorkspaceRootReducer = (reducer: Reducer) => {
  return (state: AppState | undefined, action: UnknownAction): AppState => {
    if (action.type === workspaceLoaded.type) {
      const saveFile = (action as PayloadAction<OpenWorkspaceResult>).payload
      const nodes: SaveFile['nodes'] = saveFile.content.nodes
      const nodesById = nodes.reduce((acc, node) => ({
        ...acc,
        [node.id]: node,
      }), {} as Partial<Record<string, Node>>)

      return {
        ui: {
          debugMode: saveFile.content.debugMode ?? false,
        },
        undoable: {
          past: [],
          present: {
            ui: {
              workspacePath: saveFile.path,
              openedNode: saveFile.content.openedNode,
              backStack: [],
              forwardStack: [],
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
  return (state: UndoableState | undefined, action: UnknownAction): UndoableState => {
    const newState = reducer(state, action) as UndoableState
    if (action.type === markWorkspaceClean.type) {
      return {
        ...newState,
        ui: {
          ...newState.ui,
          workspaceDirty: false,
        },
      }
    }
    if (newState.ui.workspaceDirty || !newState.ui.workspacePath || newState === state) {
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

export const selectWorkspaceDirty = (state: AppState) => state.undoable.present.ui.workspaceDirty
