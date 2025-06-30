import {NodeViewWithParent, ParentNodeView} from '@/common/node-views'
import {isParentNode, Node} from '@/common/nodes'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {resolveNodeView} from '@/renderer/redux/nodes/helpers'
import {nodeExpandedChanged, nodeMoved} from '@/renderer/redux/nodes/nodesSlice'
import {focusRestoreRequested} from '@/renderer/redux/ui/uiSlice'
import {Selection} from '@/renderer/util/selection'

export function indentNode(
  nodeView: NodeViewWithParent<Node>,
  intoNewParentRef: NodeViewWithParent<Node>,
  currentSelection: Selection,
) {
  return createUndoTransaction((dispatch: AppDispatch, getState: () => AppState) => {
    const {
      node: newParent,
      viewContext: newParentContext,
    } = resolveNodeView(getState().undoable.present.nodes, intoNewParentRef)
    if (!isParentNode(newParent)) {
      console.debug(`Indent canceled: Can't indent node ${nodeView.nodeId} into non-parent node ${newParent.id}`)
      return
    }
    // Move Node to new parent
    dispatch(nodeMoved({
      nodeView: nodeView,
      newParentId: newParent.id,
      newIndex: newParent.content.length,
    }))
    // Make sure the indented node stays in view
    if (newParentContext && !newParentContext?.isExpanded) {
      dispatch(nodeExpandedChanged({ nodeView: intoNewParentRef, expanded: true }))
    }
    // Restore focus
    dispatch(focusRestoreRequested({
      nodeView: { nodeId: nodeView.nodeId, parent: { ...intoNewParentRef, nodeId: newParent.id } },
      selection: currentSelection,
    }))
  })
}

export function outdentNode(
  nodeView: NodeViewWithParent<Node>,
  intoParentView: ParentNodeView,
  atIndex: number,
  currentSelection: Selection,
) {
  return (dispatch: AppDispatch) => {
    dispatch(nodeMoved({ nodeView: nodeView, newParentId: intoParentView.nodeId, newIndex: atIndex }))
    dispatch(focusRestoreRequested({
      nodeView: { nodeId: nodeView.nodeId, parent: intoParentView },
      selection: currentSelection,
    }))
  }
}
