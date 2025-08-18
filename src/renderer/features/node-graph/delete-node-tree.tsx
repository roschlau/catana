import {Node} from '@/common/nodes'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {getNode} from '@/renderer/features/node-graph/helpers'
import {nodeTreeDeleted} from '@/renderer/features/node-graph/nodes-slice'
import {nodeOpened} from '@/renderer/features/navigation/navigation-slice'
import {AppCommand} from '@/renderer/commands/app-command'
import {ArrowBigUp, DeleteIcon, TrashIcon} from 'lucide-react'

export const deleteNodeCommand: AppCommand = {
  name: 'Delete Node',
  icon: <TrashIcon/>,
  shortcut: ['Ctrl', <ArrowBigUp size={16}/>, <DeleteIcon/>],
  canActivate: ({focus}) => !!focus,
  thunkCreator: ({focus}) => deleteNodeTree(focus!.nodeView.nodeId)
}

export function deleteNodeTree(nodeId: Node['id']) {
  return (dispatch: AppDispatch, getState: () => AppState) => {
    const node = getNode(getState().undoable.present.nodes, nodeId)
    if (!node) return
    dispatch(nodeTreeDeleted({ nodeId }))
    const openedNode = getState().undoable.present.navigation.openedNode
    if (openedNode !== nodeId) {
      return
    }
    // Deleted Node was currently open in UI, need to switch to its owner
    const parentNodeId = node.ownerId
    if (parentNodeId) {
      const parentNode = getNode(getState().undoable.present.nodes, parentNodeId)
      if (parentNode.type === 'property') {
        // Property nodes can't be opened by themselves, so go one step further up the tree
        dispatch(nodeOpened({ nodeId: parentNode.ownerId }))
      } else {
        dispatch(nodeOpened({ nodeId: parentNode.id }))
      }
    }
  }
}
