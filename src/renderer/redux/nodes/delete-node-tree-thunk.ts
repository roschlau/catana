import {Node} from '@/common/nodes'
import {AppDispatch, RootState} from '@/renderer/redux/store'
import {getNode} from '@/renderer/redux/nodes/helpers'
import {nodeTreeDeleted} from '@/renderer/redux/nodes/nodesSlice'
import {nodeOpened} from '@/renderer/redux/ui/uiSlice'

export function deleteNodeTree(nodeId: Node['id']) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const node = getNode(getState().undoable.present.nodes, nodeId)
    if (!node) return
    dispatch(nodeTreeDeleted({ nodeId }))
    const openedNode = getState().undoable.present.ui.openedNode
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
