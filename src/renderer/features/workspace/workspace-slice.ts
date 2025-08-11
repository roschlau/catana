import {AppState, UndoableState} from '@/renderer/redux/store'
import {SaveFile} from '@/main/persistence/schema/workspace-file-schema'
import {Node} from '@/common/nodes'
import {createAction, createSlice, PayloadAction, Reducer, UnknownAction} from '@reduxjs/toolkit'
import {OpenWorkspaceResult} from '@/preload/catana-api'
import {testingTags} from '@/renderer/features/tags/tags-slice'

export interface WorkspaceState {
  workspacePath: string
  workspaceDirty: boolean,
}

/**
 * All parts of UI state that should be captured in global undo history
 */
export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: null as WorkspaceState | null,
  reducers: {},
})

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
            tags: testingTags,
            workspace: {
              workspacePath: saveFile.path,
              workspaceDirty: false,
            },
            navigation: {
              openedNode: saveFile.content.openedNode,
              backStack: [],
              forwardStack: [],
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
  return (state: UndoableState | undefined, action: UnknownAction): UndoableState => {
    const newState = reducer(state, action) as UndoableState
    if (action.type === markWorkspaceClean.type) {
      return {
        ...newState,
        workspace: newState.workspace && {
          ...newState.workspace,
          workspaceDirty: false,
        },
      }
    }
    if (!newState.workspace || newState.workspace.workspaceDirty || newState === state) {
      return newState
    }
    return {
      ...newState,
      workspace: {
        ...newState.workspace,
        workspaceDirty: true,
      },
    }
  }
}

export const selectIsWorkspaceLoaded = (state: AppState) => state.undoable.present.workspace !== null
export const selectWorkspaceDirty = (state: AppState) => state.undoable.present.workspace?.workspaceDirty ?? false
