import {markWorkspaceClean} from '@/renderer/redux/workspace-persistence'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {SaveFile} from '@/main/persistence/schema/workspace-file-schema'
import {Node} from '@/common/nodes'
import {AppCommand} from '@/renderer/commands/app-command'
import {SaveIcon} from 'lucide-react'

export const saveWorkspaceCommand: AppCommand = {
  name: "Save Workspace",
  icon: <SaveIcon/>,
  shortcut: ['Ctrl', 'S'],
  additionalSearchTerms: 'workspace commit store',
  canActivate: () => true,
  thunkCreator: () => saveWorkspace,
}

export async function saveWorkspace(dispatch: AppDispatch, getStore: () => AppState) {
  await window.catanaAPI.saveWorkspace(serialize(getStore()))
  dispatch(markWorkspaceClean())
}

export function serialize(state: AppState): SaveFile {
  const nodes: SaveFile['nodes'] = []
  nodes.push(...Object.values(state.undoable.present.nodes as Record<string, Node>))
  return {
    v: 3,
    openedNode: state.undoable.present.navigation.openedNode,
    debugMode: state.ui.debugMode,
    nodes,
  }
}
