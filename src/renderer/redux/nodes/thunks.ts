import {AppDispatch, RootState} from '../store'
import {resolveNodeRef} from './helpers'
import {nanoid} from '@reduxjs/toolkit'
import {focusRestoreRequested} from '../ui/uiSlice'
import {nodeExpandedChanged, nodeMoved, nodesMerged, nodeSplit, titleUpdated} from './nodesSlice'
import {NodeId, NodeReference} from '../../../common/nodeGraphModel'

export interface Selection {
  start: number,
  end: number,
}

export function indentNode(nodeRef: NodeReference, intoNewParentRef: NodeReference, currentSelection: Selection) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const { node: newParent, parentInfo: newParentView } = resolveNodeRef(getState().nodes.present, intoNewParentRef)
    // Move Node to new parent
    dispatch(nodeMoved({
      nodeRef,
      newParentId: newParent.id,
      newIndex: newParent.content.length,
    }))
    // Make sure the indented node stays in view
    if (newParentView && !newParentView.childRef.expanded) {
      dispatch(nodeExpandedChanged({ nodeRef: intoNewParentRef, expanded: true }))
    }
    // Restore focus
    dispatch(focusRestoreRequested({
      nodeRef: { nodeId: nodeRef.nodeId, parentId: newParent.id },
      selection: currentSelection,
    }))
  }
}

export function outdentNode(nodeRef: NodeReference, intoNode: NodeId, atIndex: number, currentSelection: Selection) {
  return (dispatch: AppDispatch) => {
    dispatch(nodeMoved({ nodeRef, newParentId: intoNode, newIndex: atIndex }))
    dispatch(focusRestoreRequested({
      nodeRef: { nodeId: nodeRef.nodeId, parentId: intoNode },
      selection: currentSelection,
    }))
  }
}

export function splitNode(nodeRef: NodeReference, selectionStart: number, selectionEnd: number) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const splitIndex = selectionStart
    const { node, parentInfo } = resolveNodeRef(getState().nodes.present, nodeRef)
    if (selectionEnd !== splitIndex) {
      dispatch(titleUpdated({
        nodeId: node.id,
        title: node.title.slice(0, splitIndex) + node.title.slice(selectionEnd),
      }))
    }
    const newParentId = (parentInfo?.childRef.expanded && node.content.length > 0)
      ? node.id
      : parentInfo?.parent.id ?? node.id
    const newNodeId = nanoid()
    dispatch(nodeSplit({ nodeRef, newNodeId, atIndex: splitIndex, parentId: newParentId }))
    dispatch(focusRestoreRequested({
      nodeRef: { nodeId: newNodeId, parentId: newParentId },
      selection: { start: 0 },
    }))
  }
}

export function mergeNode(nodeRef: NodeReference, viewPath: NodeId[], direction: 'prev' | 'next') {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().nodes.present
    const { node, parentInfo } = resolveNodeRef(state, nodeRef)
    if (parentInfo && node.ownerId !== parentInfo?.parent.id) {
      console.debug(`Node Merge canceled: Can't merge node link ${node.id} into surrounding nodes`)
      return
    }
    if (direction === 'prev') {
      // Merge with previous sibling or parent
      if (!parentInfo) {
        console.debug(`Node Merge canceled: Can't merge node ${node.id} with previous outside of parent context`)
        return
      }
      const childIndex = parentInfo.childIndex
      const previousSiblingRef = parentInfo.parent.content[childIndex - 1]
      const nodeToMergeWith = state[previousSiblingRef?.nodeId ?? parentInfo.parent.id]!
      const parentOfMerge = previousSiblingRef ? parentInfo.parent.id : viewPath[viewPath.length - 2]
      dispatch(nodesMerged({ firstNodeId: nodeToMergeWith.id, secondNodeRef: nodeRef }))
      dispatch(focusRestoreRequested({
        nodeRef: { nodeId: nodeToMergeWith.id, parentId: parentOfMerge },
        selection: { start: nodeToMergeWith.title.length },
      }))
      return
    }
    if (direction === 'next') {
      let nodeToMergeWithRef: NodeReference
      if (!parentInfo) {
        // Merge with first child node
        if (node.content.length === 0) {
          console.debug(`Node Merge canceled: ${node.id} has no children to merge with outside of parent context`)
          return
        }
        nodeToMergeWithRef = { nodeId: node.content[0].nodeId, parentId: node.id }
      } else if (parentInfo.childRef.expanded && node.content.length > 0) {
        // Merge with first child node
        nodeToMergeWithRef = { nodeId: node.content[0].nodeId, parentId: node.id }
      } else {
        // Merge with next sibling
        const parent = parentInfo.parent
        const childIndex = parentInfo.childIndex
        const nextSibling = parent.content[childIndex + 1]
        if (!nextSibling) {
          console.debug(`Node Merge canceled: Node ${node.id} is the last in its parent and can't be merged forward`)
          return
        }
        nodeToMergeWithRef = { nodeId: nextSibling.nodeId, parentId: parent.id }
      }
      dispatch(nodesMerged({ firstNodeId: node.id, secondNodeRef: nodeToMergeWithRef }))
      dispatch(focusRestoreRequested({
        nodeRef: { nodeId: node.id, parentId: parentInfo?.parent.id },
        selection: { start: node.title.length },
      }))
    }
  }
}
