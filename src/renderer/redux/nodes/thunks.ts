import {AppDispatch, RootState} from '../store'
import {getParentNode, resolveNode} from './helpers'
import {nanoid} from '@reduxjs/toolkit'
import {focusRestoreRequested} from '../ui/uiSlice'
import {nodeExpandedChanged, nodeMoved, nodesMerged, nodeSplit, titleUpdated} from './nodesSlice'
import {NodeId} from '../../../common/nodeGraphModel'

export interface Selection {
  start: number,
  end: number,
}

export function indentNode(nodeId: NodeId, intoViewParentId: NodeId, currentSelection: Selection) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const { node: newParent, link: parentLink } = resolveNode(getState().nodes.present, intoViewParentId)
    // Move Node to new parent
    dispatch(nodeMoved({
      nodeId,
      newParentId: newParent.id,
      newIndex: newParent.contentNodeIds.length,
    }))
    // Make sure the indented node stays in view
    const viewParent = parentLink ?? newParent
    if (!viewParent.expanded) {
      dispatch(nodeExpandedChanged({ nodeId: viewParent.id, expanded: true }))
    }
    // Restore focus
    dispatch(focusRestoreRequested({
      nodeId,
      selectionStart: currentSelection.start,
      selectionEnd: currentSelection.end,
    }))
  }
}

export function outdentNode(nodeId: NodeId, intoNode: NodeId, atIndex: number, currentSelection: Selection) {
  return (dispatch: AppDispatch) => {
    dispatch(nodeMoved({ nodeId, newParentId: intoNode, newIndex: atIndex }))
    dispatch(focusRestoreRequested({
      nodeId,
      selectionStart: currentSelection.start,
      selectionEnd: currentSelection.end,
    }))
  }
}

export function splitNode(nodeId: NodeId, isExpanded: boolean, selectionStart: number, selectionEnd: number) {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const splitIndex = selectionStart
    const { node, link } = resolveNode(getState().nodes.present, nodeId)
    if (selectionEnd !== splitIndex) {
      dispatch(titleUpdated({ nodeId, title: node.title.slice(0, splitIndex) + node.title.slice(selectionEnd) }))
    }
    const parentId = isExpanded
      ? node.id
      : (link ?? node).parentNodeId ?? node.id
    const newNodeId = nanoid()
    dispatch(nodeSplit({ nodeId, newNodeId, atIndex: splitIndex, parentId }))
    dispatch(focusRestoreRequested({
      nodeId: newNodeId,
      selectionStart: 0,
    }))
  }
}

export function mergeNode(nodeId: NodeId, direction: 'prev' | 'next', isExpanded: boolean) {
  console.debug('mergeNode', nodeId, direction, isExpanded)
  return (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().nodes.present
    const { node, link } = resolveNode(state, nodeId)
    if (link) {
      console.debug(`Node Merge canceled: Can't merge node link ${link.id} into surrounding nodes`)
      return
    }
    if (direction === 'prev') {
      // Merge with previous sibling or parent
      const parent = getParentNode(state, node)
      if (!parent) {
        console.debug(`Node Merge canceled: Can't merge node ${node.id} with previous node because it has no parent node`)
        return
      }
      const childIndex = parent.contentNodeIds.indexOf(node.id)
      const previousSiblingId = parent.contentNodeIds[childIndex - 1]
      const nodeToMergeWith = state[previousSiblingId ?? parent.id]!
      if (nodeToMergeWith.type !== 'text') {
        console.debug(`Node Merge canceled: Can't merge node ${node.id} into non-text node ${nodeToMergeWith.id}`)
        return
      }
      const selectionStart = nodeToMergeWith.title.length
      dispatch(nodesMerged({ firstNodeId: nodeToMergeWith.id, secondNodeId: nodeId }))
      dispatch(focusRestoreRequested({ nodeId: nodeToMergeWith.id, selectionStart }))
      return
    }
    if (direction === 'next') {
      const selectionStart = node.title.length
      let nodeToMergeWithId: NodeId
      if (isExpanded && node.contentNodeIds.length > 0) {
        // Merge with first child node
        nodeToMergeWithId = node.contentNodeIds[0] // No undefined check necessary because we already checked that
      } else {
        // Merge with next sibling
        const parent = getParentNode(state, node)
        if (!parent) {
          console.debug(`Node Merge canceled: Can't merge node ${node.id} with next node because it has no children or parent`)
          return
        }
        const childIndex = parent.contentNodeIds.indexOf(node.id)
        const nextSibling = parent.contentNodeIds[childIndex + 1]
        if (!nextSibling) {
          console.debug(`Node Merge canceled: Node ${node.id} is the last in its parent and can't be merged forward`)
          return
        }
        nodeToMergeWithId = nextSibling
      }
      if (state[nodeToMergeWithId]!.type !== 'text') {
        console.debug(`Node Merge canceled: Can't merge node ${node.id} into non-text node ${nodeToMergeWithId}`)
        return
      }
      dispatch(nodesMerged({ firstNodeId: nodeId, secondNodeId: nodeToMergeWithId }))
      dispatch(focusRestoreRequested({ nodeId: nodeId, selectionStart }))
    }
  }
}
