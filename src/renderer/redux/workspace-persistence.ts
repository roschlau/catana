import {RootState} from '@/renderer/redux/store'
import {SaveFile} from '@/main/nodegraph-file-schema'
import {Node} from '@/common/nodes'
import {createAction, PayloadAction, Reducer, UnknownAction} from '@reduxjs/toolkit'
import {OpenNodeGraphResult} from '@/preload/catana-api'

export function serialize(state: RootState): SaveFile {
  const nodes: SaveFile['nodes'] = []
  nodes.push(...Object.values(state.undoable.present.nodes as Record<string, Node>))
  return {
    v: 1,
    openedNode: state.undoable.present.ui.openedNode,
    debugMode: state.ui.debugMode,
    nodes,
  }
}

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
          debugMode: saveFile.content.debugMode,
        },
        undoable: {
          past: [],
          present: {
            ui: {
              openedNode: saveFile.content.openedNode,
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
