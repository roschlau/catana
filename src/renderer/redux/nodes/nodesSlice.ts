import {createSelector, createSlice, nanoid, PayloadAction} from '@reduxjs/toolkit'
import {AppDispatch, RootState} from '../store'
import {demoGraph} from './demoGraph'
import {focusRestoreRequested} from '../ui/uiSlice'
import {clamp} from '../../util/math'

export type Node = TextNode | NodeLink
export interface ResolvedNode {
  node: Exclude<Node, NodeLink>,
  link?: NodeLink,
}

export interface TextNode {
  id: string
  type: 'text'
  title: string
  parentNodeId: string | null
  /**
   * A list of Node IDs that are nested under this node. This list _might_ be incomplete if there are nodes that have
   * this one as their parent, but have not been added to this array because of a bug or someone messed with the saved
   * state manually. Those nodes need to be implicitly appended to this list to get the full content of this node.
   * `selectContentNodeIds` does that for you.
   */
  contentNodeIds: string[]
}

export interface NodeLink {
  type: 'nodeLink'
  id: string
  nodeId: string
  parentNodeId: string | null
}

export const nodesSlice = createSlice({
  name: 'nodes',
  initialState: demoGraph,
  reducers: {
    titleUpdated: (state, action: PayloadAction<{ nodeId: string, title: string }>) => {
      const node = state[action.payload.nodeId]!
      if (node.type !== 'text') {
        throw Error('Can\'t update title for elements of type ' + node.type)
      }
      node.title = action.payload.title
    },
    nodeIndexChanged: (state, action: PayloadAction<{ nodeId: string, indexChange: number }>) => {
      const node = state[action.payload.nodeId]!
      const parentNode = getParentNode(state, node)
      if (!parentNode) {
        // Can't move around the root node
        return
      }
      const existingNodeIndex = parentNode.contentNodeIds.indexOf(action.payload.nodeId)
      const newIndex = clamp(existingNodeIndex + action.payload.indexChange, 0, parentNode.contentNodeIds.length - 1)
      parentNode.contentNodeIds.splice(existingNodeIndex, 1)
      parentNode.contentNodeIds.splice(newIndex, 0, action.payload.nodeId)
    },
    nodeIndented: (state, action: PayloadAction<{ nodeId: string }>) => {
      const node = state[action.payload.nodeId]!
      const oldParent = getParentNode(state, node)
      if (!oldParent) {
        // Can't indent the root node
        return
      }
      const oldSiblings = oldParent.contentNodeIds
      const oldSiblingIndex = oldSiblings.indexOf(action.payload.nodeId)
      if (oldSiblingIndex === 0) {
        // Can't indent node that doesn't have a preceding sibling because that would skip indentation levels
        return
      }
      const newParentId = oldSiblings[oldSiblingIndex - 1]
      const newParent = resolveNode(state, newParentId).node
      const newSiblings = newParent.contentNodeIds
      const indexUnderNewParent = newSiblings.length
      newSiblings.splice(indexUnderNewParent, 0, action.payload.nodeId)
      oldSiblings.splice(oldSiblingIndex, 1)
      node.parentNodeId = newParentId
    },
    nodeOutdented: (state, action: PayloadAction<{ nodeId: string, viewPath: string[] }>) => {
      if (action.payload.viewPath.length < 2) {
        // We're already at the root level of the current view, can't outdent any further
        return
      }
      const node = state[action.payload.nodeId]!
      const oldParent = resolveNode(state, action.payload.viewPath[action.payload.viewPath.length - 1])
      const newParent = resolveNode(state, action.payload.viewPath[action.payload.viewPath.length - 2])
      const oldParentIndex = newParent.node.contentNodeIds.indexOf((oldParent.link ?? oldParent.node).id)
      const newSiblingIndex = oldParentIndex + 1
      const oldSiblingIndex = oldParent.node.contentNodeIds.indexOf(action.payload.nodeId)
      oldParent.node.contentNodeIds.splice(oldSiblingIndex, 1)
      newParent.node.contentNodeIds.splice(newSiblingIndex, 0, action.payload.nodeId)
      node.parentNodeId = newParent.node.id
    },
    nodeSplit: (state, action: PayloadAction<{ nodeId: string, newNodeId: string, atIndex: number, parentId: string }>) => {
      const node = resolveNode(state, action.payload.nodeId).node
      const newNode: TextNode = {
        type: 'text',
        id: action.payload.newNodeId,
        title: node.title.slice(action.payload.atIndex),
        parentNodeId: action.payload.parentId,
        contentNodeIds: [] as string[],
      }
      console.log('Adding new node', newNode)
      state[newNode.id] = newNode
      node.title = node.title.slice(0, action.payload.atIndex)
      if (newNode.parentNodeId === node.id) {
        node.contentNodeIds.unshift(newNode.id)
      } else {
        const parentNode = getParentNode(state, newNode)!
        const existingNodeIndex = parentNode.contentNodeIds.indexOf(action.payload.nodeId)
        parentNode.contentNodeIds.splice(existingNodeIndex + 1, 0, newNode.id)
      }
    },
  },
})

export const { titleUpdated, nodeIndexChanged, nodeSplit, nodeIndented, nodeOutdented } = nodesSlice.actions

/**
 * Returns an object containing the non-link node that the given nodeId points to. If the given node is already a
 * non-link node, it is returned directly as the `node` property. If the given node is a link node, then it will be
 * available in the `link` property, and the `node` property will be the node that the link points to.
 */
export const selectResolvedNode = createSelector(
  [
    (state: RootState) => state.nodes.present,
    (_: RootState, nodeId: string) => nodeId,
  ],
  (nodes, nodeId) => {
    return resolveNode(nodes, nodeId)
  },
)

/**
 * Returns the IDs of all nodes that are children of the given node.
 */
export const selectContentNodeIds = createSelector(
  [
    (state: RootState) => state.nodes.present,
    (_: RootState, nodeId: string) => nodeId,
  ],
  (nodes, nodeId) => {
    const explicitContent = resolveNode(nodes, nodeId).node.contentNodeIds
    const explicitIDsSet = new Set(explicitContent)
    const implicitContent = Object.values(nodes)
      .filter(node => node && node.parentNodeId === nodeId && !explicitIDsSet.has(node.id))
      .map(node => node!.id)
    return [...explicitContent, ...implicitContent]
  },
)

export function indentNode(nodeId: string, element: HTMLTextAreaElement) {
  return (dispatch: AppDispatch) => {
    dispatch(nodeIndented({ nodeId }))
    dispatch(focusRestoreRequested({
      nodeId,
      selectionStart: element.selectionStart,
      selectionEnd: element.selectionEnd,
    }))
  }
}

export function outdentNode(nodeId: string, viewPath: string[], element: HTMLTextAreaElement) {
  return (dispatch: AppDispatch) => {
    dispatch(nodeOutdented({ nodeId, viewPath }))
    dispatch(focusRestoreRequested({
      nodeId,
      selectionStart: element.selectionStart,
      selectionEnd: element.selectionEnd,
    }))
  }
}

export function splitNode(nodeId: string, isExpanded: boolean, selectionStart: number, selectionEnd: number) {
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
      selectionEnd: 0,
    }))
  }
}

export default nodesSlice.reducer

/**
 * Returns an object containing the non-link node that the given nodeId points to. If the given node is already a
 * non-link node, it is returned directly as the `node` property. If the given node is a link node, then it will be
 * available in the `link` property, and the `node` property will be the node that the link points to.
 */
function resolveNode(state: Partial<Record<string, Node>>, nodeId: string): ResolvedNode {
  const node = state[nodeId]!
  if (node.type !== 'nodeLink') {
    return { node }
  }
  const linkedNode = state[node.nodeId]!
  if (linkedNode.type === 'nodeLink') {
    throw Error(`Link node ${node.nodeId} points to another link node ${linkedNode.nodeId}. This is not supported.`)
  }
  return { node: linkedNode, link: node }
}

function getParentNode(state: Partial<Record<string, Node>>, node: Node): TextNode | null {
  const parentNodeId = node.parentNodeId
  if (!parentNodeId) {
    return null
  }
  const parentNode = state[parentNodeId]!
  if (parentNode.type === 'nodeLink') {
    // Currently, node links can't have children, so if this happens, we got a bug somewhere or someone messed with the
    // saved state manually. This might change in the future - we could add support for node links having child nodes
    // that are nested under them and are separate from the linked node's content.
    throw Error(`Node ${node.id} is illegally owned by a Node Link (${parentNode.id}).`)
  }
  return parentNode
}
