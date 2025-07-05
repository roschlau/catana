import {NodeView} from '@/common/node-views'
import {Id, NodeGraphFlattened, TextNode} from '@/common/nodes'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {resolveNodeView} from '@/renderer/redux/nodes/helpers'
import {nodeLinksAdded, nodeTreeAdded, nodeTreeDeleted} from '@/renderer/redux/nodes/nodesSlice'
import {focusRestoreRequested} from '@/renderer/redux/ui/uiSlice'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'

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

export const insertTrees = (
  currentNode: NodeView<TextNode>,
  graphs: { nodes: NodeGraphFlattened, rootId: Id<'node'> }[],
) => createUndoTransaction((
  dispatch: AppDispatch,
  getState: () => AppState,
) => {
  const { node, viewContext } = resolveNodeView(getState().undoable.present.nodes, currentNode)
  if (node.title === '' && node.content.length === 0 && viewContext) {
    // Current node is empty, replace it with the inserted content's root node
    const parentNode = viewContext.parent
    dispatch(nodeTreeDeleted({ nodeId: node.id }))
    const index = viewContext.childIndex
    for (const { nodes, rootId } of graphs.toReversed()) {
      dispatch(nodeTreeAdded({ graph: nodes, root: rootId, parent: parentNode.id, index }))
    }
  } else {
    // Insert after current (if it has a view parent) or inside current (if it is view root)
    const parentId = viewContext?.parent.id ?? currentNode.nodeId
    const index = parentId === node.id ? 0 : (viewContext!.childIndex + 1)
    for (const { nodes, rootId } of graphs.toReversed()) {
      dispatch(nodeTreeAdded({ graph: nodes, root: rootId, parent: parentId, index }))
    }
  }
})
