import {markWorkspaceClean} from '@/renderer/features/workspace/workspace-slice'
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
  dispatch(markWorkspaceClean())
  await window.catanaAPI.saveWorkspace(serialize(getStore()))
}

export function serialize(state: AppState): SaveFile {
  const nodes: SaveFile['nodes'] = []
  nodes.push(...Object.values(state.undoable.present.nodes as Record<Node['id'], Node>))
  const tags: SaveFile['tags'] = []
  tags.push(...Object.values(state.undoable.present.tags))
  return {
    v: 3,
    openedNode: state.undoable.present.navigation.openedNode,
    debugMode: state.ui.debugMode,
    nodes,
    tags,
  }
}
