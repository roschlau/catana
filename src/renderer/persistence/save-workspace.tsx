import {markWorkspaceClean} from '@/renderer/redux/workspace-persistence'
import {AppDispatch, RootState} from '@/renderer/redux/store'
import {SaveFile} from '@/main/workspace-file-schema'
import {Node} from '@/common/nodes'
import {AppCommand} from '@/renderer/commands/app-command'
import {SaveIcon} from 'lucide-react'

export const saveWorkspaceCommand: AppCommand = {
  name: "Save Workspace",
  icon: <SaveIcon/>,
  shortcut: 'Ctrl + S',
  additionalSearchTerms: 'workspace commit store',
  canActivate: () => true,
  thunkCreator: () => saveWorkspace,
}

export async function saveWorkspace(dispatch: AppDispatch, getStore: () => RootState) {
  await window.catanaAPI.saveWorkspace(serialize(getStore()))
  dispatch(markWorkspaceClean())
}

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
