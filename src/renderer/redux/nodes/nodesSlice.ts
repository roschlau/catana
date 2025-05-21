import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {demoGraph, flatten} from './demoGraph'
import {clamp} from '../../util/math'
import {deleteNode, getParentNode, moveNodes, resolveNode} from './helpers'

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
  expanded: boolean
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
  expanded: boolean
}

export const nodesSlice = createSlice({
  name: 'nodes',
  initialState: flatten(demoGraph),
  reducers: {
    titleUpdated: (state, action: PayloadAction<{ nodeId: string, title: string }>) => {
      const node = state[action.payload.nodeId]!
      if (node.type !== 'text') {
        throw Error('Can\'t update title for elements of type ' + node.type)
      }
      node.title = action.payload.title
    },
    nodeExpandedChanged: (state, action: PayloadAction<{ nodeId: string, expanded: boolean }>) => {
      const node = state[action.payload.nodeId]!
      node.expanded = action.payload.expanded
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
      newParent.expanded = true
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
    nodeSplit: (state, action: PayloadAction<{
      nodeId: string,
      newNodeId: string,
      atIndex: number,
      parentId: string
    }>) => {
      const node = resolveNode(state, action.payload.nodeId).node
      const newNode: TextNode = {
        type: 'text',
        id: action.payload.newNodeId,
        title: node.title.slice(action.payload.atIndex),
        parentNodeId: action.payload.parentId,
        contentNodeIds: [] as string[],
        expanded: false,
      }
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
    /**
     * Merges the second node into the first node by appending the second node's title, prepending its children, and
     * moving any links to it to the first node.
     */
    nodesMerged: (state, action: PayloadAction<{ firstNodeId: string, secondNodeId: string }>) => {
      console.debug('nodesMerged', action.payload)
      const firstNode = state[action.payload.firstNodeId]!
      const secondNode = state[action.payload.secondNodeId]!
      if (firstNode.type !== 'text' || secondNode.type !== 'text') {
        throw Error('Can\'t merge nodes of type ' + firstNode.type + ' and ' + secondNode.type)
      }
      if (firstNode.parentNodeId === secondNode.parentNodeId) {
        const parent = getParentNode(state, firstNode)!
        const nodeIndex = parent.contentNodeIds.indexOf(action.payload.firstNodeId)
        const mergedNodeIndex = parent.contentNodeIds.indexOf(action.payload.secondNodeId)
        if (nodeIndex + 1 !== mergedNodeIndex) {
          throw Error('Can\'t merge nodes that are not next to each other')
        }
      } else {
        if (firstNode.id !== secondNode.parentNodeId) {
          throw Error('Can only merge nodes that are either parent and first child or immediate siblings')
        }
      }
      firstNode.title += secondNode.title
      moveNodes(state, secondNode.contentNodeIds, firstNode.id, 0)
      deleteNode(state, secondNode, firstNode.id)
    },
  },
})

export const {
  titleUpdated,
  nodeIndexChanged,
  nodeSplit,
  nodeIndented,
  nodeOutdented,
  nodeExpandedChanged,
  nodesMerged,
} = nodesSlice.actions
