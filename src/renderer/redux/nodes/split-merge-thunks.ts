import {NodeView, NodeViewWithParent} from '@/common/node-views'
import {Id, Node, TextNode} from '@/common/nodes'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {AppDispatch, RootState} from '@/renderer/redux/store'
import {getNode, resolveNodeView} from '@/renderer/redux/nodes/helpers'
import {nodeCreated, nodeExpandedChanged, nodesMerged, titleUpdated} from '@/renderer/redux/nodes/nodesSlice'
import {nanoid} from '@reduxjs/toolkit'
import {focusRestoreRequested} from '@/renderer/redux/ui/uiSlice'

export function splitNode(nodeView: NodeView<TextNode>, selectionStart: number, selectionEnd: number) {
  return createUndoTransaction((dispatch: AppDispatch, getState: () => RootState) => {
    const { node, viewContext } = resolveNodeView(getState().undoable.present.nodes, nodeView)
    if (node.type !== 'node') {
      console.debug(`Split canceled: Can't split non-node node ${node.id}`)
      return
    }
    if (selectionStart !== selectionEnd) {
      dispatch(titleUpdated({
        nodeId: node.id,
        title: node.title.slice(0, selectionStart) + node.title.slice(selectionEnd),
      }))
    }
    const splitIndex = selectionStart
    const newNodeId = nanoid() as Id<'node'>
    const newNodeBase = {
      nodeId: newNodeId,
      title: node.title.slice(splitIndex),
    }
    if (!viewContext || viewContext.isExpanded && node.content.length > 0) {
      // Split into first child
      dispatch(nodeCreated({
        ...newNodeBase,
        ownerId: nodeView.nodeId,
        indexInOwner: 0,
      }))
      if (viewContext && !viewContext.isExpanded) {
        // Make sure the split node stays in view
        // `nodeView` definitely has a parent here, but the compiler doesn't know that, so we're hacking around that
        const nodeViewWithParent = { ...nodeView, parent: viewContext.parentView }
        dispatch(nodeExpandedChanged({ nodeView: nodeViewWithParent, expanded: true }))
      }
      dispatch(focusRestoreRequested({
        nodeRef: { nodeId: newNodeId, parent: nodeView },
        selection: { start: 0 },
      }))
    } else {
      // Split into sibling
      dispatch(nodeCreated({
        ...newNodeBase,
        ownerId: viewContext.parentView.nodeId,
        indexInOwner: viewContext.childIndex + 1,
      }))
      dispatch(focusRestoreRequested({
        nodeRef: { nodeId: newNodeId, parent: viewContext.parentView },
        selection: { start: 0 },
      }))
    }
    dispatch(titleUpdated({ nodeId: node.id, title: node.title.slice(0, splitIndex) }))
  })
}

/**
 * Merges a node into the node preceding it in the current view. That can either be its parent if it is the first child
 * node, or its preceding sibling node if it isn't.
 * Nodes can only be merged with siblings or parents when the current view parent is their owner; this function will
 * no-op when attempting to merge a node in any other view.
 */
export function mergeNodeBackward(nodeView: NodeViewWithParent<TextNode>) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().undoable.present.nodes
    const { node, viewContext } = resolveNodeView(state, nodeView)
    if (node.ownerId !== viewContext?.parent.id) {
      console.debug(`Node Merge canceled: Can't merge node link ${node.id} into surrounding nodes`)
      return
    }
    if (node.type !== 'node') {
      console.debug(`Merge canceled: Can't merge non-text node ${node.id}`)
      return
    }
    // Merge with previous sibling or parent
    const childIndex = viewContext.childIndex
    const previousSiblingRef = viewContext.parent.content[childIndex - 1]
    const nodeToMergeWith = getNode(state, previousSiblingRef?.nodeId ?? viewContext.parent.id)
    if (nodeToMergeWith.type !== 'node') {
      console.debug(`Merge canceled: Can't merge non-text node ${nodeToMergeWith.id} with ${node.id}`)
      return
    }
    dispatch(nodesMerged({ firstNodeId: nodeToMergeWith.id, secondNodeRef: nodeView }))
    const focusParent = previousSiblingRef ? nodeView.parent : nodeView.parent.parent
    dispatch(focusRestoreRequested({
      nodeRef: { nodeId: nodeToMergeWith.id, parent: focusParent },
      selection: { start: nodeToMergeWith.title.length },
    }))
  }
}

/**
 * Merges a node into the node following it in the current view. That can be either its next sibling node within its
 * parent or its first child node if it has children and is currently expanded.
 * Nodes can only be merged with siblings when viewed within their owner; this function will no-op when attempting to
 * merge a node with a sibling in a view context that is not within its owner.
 * This function will also no-op if `nodeView` has no parent and the node has no children to merge with.
 */
export function mergeNodeForward(nodeView: NodeView<TextNode>) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().undoable.present.nodes
    const { node, viewContext } = resolveNodeView(state, nodeView)
    if (node.type !== 'node') {
      console.debug(`Merge canceled: Can't merge non-text node ${node.id}`)
      return
    }
    let nodeToMergeWithRef: NodeViewWithParent<Node>
    if (!viewContext) {
      // Merge with first child node
      if (node.content.length === 0) {
        console.debug(`Merge canceled: ${node.id} has no children to merge with outside of parent context`)
        return
      }
      nodeToMergeWithRef = { nodeId: node.content[0].nodeId, parent: { nodeId: node.id } }
    } else if (viewContext.isExpanded && node.content.length > 0) {
      // Merge with first child node
      nodeToMergeWithRef = { nodeId: node.content[0].nodeId, parent: { nodeId: node.id } }
    } else {
      if (node.ownerId !== viewContext.parent.id) {
        console.debug(`Merge canceled: Can't merge link ${node.id} into surrounding nodes`)
        return
      }
      // Merge with next sibling
      const parent = viewContext.parent
      const childIndex = viewContext.childIndex
      const nextSibling = parent.content[childIndex + 1]
      if (!nextSibling) {
        console.debug(`Merge canceled: Node ${node.id} is the last in its parent and can't be merged forward`)
        return
      }
      nodeToMergeWithRef = { nodeId: nextSibling.nodeId, parent: { nodeId: parent.id } }
    }
    const nodeToMergeWith = getNode(state, nodeToMergeWithRef.nodeId)
    if (nodeToMergeWith.type !== 'node') {
      console.debug(`Merge canceled: Can't merge non-text node ${nodeToMergeWith.id} with ${node.id}`)
      return
    }
    dispatch(nodesMerged({
      firstNodeId: node.id,
      secondNodeRef: { ...nodeToMergeWithRef, nodeId: nodeToMergeWith.id },
    }))
    dispatch(focusRestoreRequested({
      nodeRef: nodeView,
      selection: { start: node.title.length },
    }))
  }
}
