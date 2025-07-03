import {NodeView, NodeViewWithParent} from '@/common/node-views'
import {Id, NodeGraphFlattened, ParentNode, TextNode} from '@/common/nodes'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {resolveNodeView} from '@/renderer/redux/nodes/helpers'
import {nodeExpandedChanged, nodeLinksAdded, nodeTreeAdded, nodeTreeDeleted} from '@/renderer/redux/nodes/nodesSlice'
import {focusRestoreRequested} from '@/renderer/redux/ui/uiSlice'

export const insertNodeLinks = (
  currentNode: NodeView<TextNode>,
  nodeIds: Id<'node'>[],
) => (
  dispatch: AppDispatch,
  getState: () => AppState,
) => {
  const { node, viewContext } = resolveNodeView(getState().undoable.present.nodes, currentNode)
  if (node.title === '' && node.content.length === 0 && viewContext) {
    // Current Node is empty, replace it
    dispatch(nodeTreeDeleted({ nodeId: node.id }))
    dispatch(nodeLinksAdded({
      parentId: viewContext.parent.id,
      childIds: nodeIds,
      index: viewContext.childIndex,
    }))
    dispatch(focusRestoreRequested({
      nodeView: { nodeId: nodeIds[0], parent: { nodeId: viewContext.parent.id } },
      selection: { start: 0 },
    }))
  } else {
    // Insert after current (if it has a view parent) or inside current (if it is view root)
    const parentId = viewContext?.parent.id ?? currentNode.nodeId
    const index = parentId === node.id ? 0 : (viewContext!.childIndex + 1)
    dispatch(nodeLinksAdded({ parentId, childIds: nodeIds, index }))
    dispatch(focusRestoreRequested({
      nodeView: { nodeId: nodeIds[0], parent: { nodeId: parentId } },
      selection: { start: 0 },
    }))
  }
}

export const insertSubtree = (
  currentNode: NodeView<TextNode>,
  graph: NodeGraphFlattened,
  rootId: Id<'node'>,
) => (
  dispatch: AppDispatch,
  getState: () => AppState,
) => {
  const { node, viewContext } = resolveNodeView(getState().undoable.present.nodes, currentNode)
  let parentNode: ParentNode
  let index: number | undefined = undefined
  if (node.title === '' && node.content.length === 0 && viewContext) {
    // Current node is empty, replace it with the inserted content's root node
    parentNode = viewContext.parent
    dispatch(nodeTreeDeleted({ nodeId: node.id }))
    index = viewContext.childIndex
  } else {
    parentNode = node
    if (currentNode.parent) {
      // Make sure the target node is expanded in the current view
      const nodeViewWithParent = currentNode as NodeViewWithParent<TextNode>
      dispatch(nodeExpandedChanged({ nodeView: nodeViewWithParent, expanded: true }))
    }
  }
  dispatch(nodeTreeAdded({ graph: graph, root: rootId, parent: parentNode.id, index }))
}
