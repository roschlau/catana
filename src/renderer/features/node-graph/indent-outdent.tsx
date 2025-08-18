import {NodeViewWithParent} from '@/common/node-views'
import {isParentNode, Node} from '@/common/nodes'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {resolveNodeView} from '@/renderer/features/node-graph/helpers'
import {nodeExpandedChanged, nodeMoved} from '@/renderer/features/node-graph/nodes-slice'
import {focusRestoreRequested} from '@/renderer/features/ui/uiSlice'
import {Selection} from '@/renderer/util/selection'
import {AppCommand} from '@/renderer/commands/app-command'
import {ArrowBigUp, ArrowRightToLine, IndentDecreaseIcon, IndentIncreaseIcon} from 'lucide-react'

export const indentCommand: AppCommand = {
  name: 'Indent Node',
  icon: <IndentIncreaseIcon/>,
  shortcut: [<ArrowRightToLine/>],
  canActivate: ({focus}) => !!focus?.nodeView.parent,
  thunkCreator: ({focus}) => indentNode(focus!.nodeView as NodeViewWithParent<Node>, focus!.selection)
}

export const outdentCommand: AppCommand = {
  name: 'Outdent Node',
  icon: <IndentDecreaseIcon/>,
  shortcut: [<ArrowBigUp/>, <ArrowRightToLine/>],
  canActivate: ({focus}) => !!focus?.nodeView.parent?.parent,
  thunkCreator: ({focus}) => outdentNode(focus!.nodeView as NodeViewWithParent<Node>, focus!.selection)
}

export function indentNode(
  nodeView: NodeViewWithParent<Node>,
  currentSelection: Selection,
) {
  return createUndoTransaction((dispatch: AppDispatch, getState: () => AppState) => {
    const nodes = getState().undoable.present.nodes
    const { viewContext } = resolveNodeView(nodes, nodeView)
    const previousSiblingRef = viewContext.parent.content[viewContext.childIndex - 1]
    if (!previousSiblingRef) {
      console.debug(`Indent canceled: ${nodeView.nodeId} has no previous sibling in current view`)
      return
    }
    const newParentRef: NodeViewWithParent<Node> = {
      nodeId: previousSiblingRef.nodeId,
      parent: viewContext.parentView,
    }
    const {
      node: newParent,
      viewContext: newParentContext,
    } = resolveNodeView(nodes, newParentRef)
    if (!isParentNode(newParent)) {
      console.debug(`Indent canceled: Previous sibling ${newParent.id} of node ${nodeView.nodeId} is not a valid parent node`)
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
      dispatch(nodeExpandedChanged({ nodeView: newParentRef, expanded: true }))
    }
    // Restore focus
    dispatch(focusRestoreRequested({
      nodeView: { nodeId: nodeView.nodeId, parent: { ...newParentRef, nodeId: newParent.id } },
      selection: currentSelection,
    }))
  })
}

export function outdentNode(
  nodeView: NodeViewWithParent<Node>,
  currentSelection: Selection,
) {
  return (dispatch: AppDispatch, getState: () => AppState) => {
    const intoParentView = nodeView.parent.parent
    if (!intoParentView) {
      console.debug(`Outdent canceled: Node ${nodeView.nodeId} has no grandparent in current view`)
      return
    }
    const { viewContext: parentViewContext } = resolveNodeView(getState().undoable.present.nodes, nodeView.parent)
    const atIndex = parentViewContext!.childIndex + 1
    dispatch(nodeMoved({ nodeView: nodeView, newParentId: intoParentView.nodeId, newIndex: atIndex }))
    dispatch(focusRestoreRequested({
      nodeView: { nodeId: nodeView.nodeId, parent: intoParentView },
      selection: currentSelection,
    }))
  }
}
