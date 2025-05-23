import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {clamp} from '../../util/math'
import {deleteNode, getParentNode, moveNodes, resolveNode} from './helpers'
import {demoGraph, flatten} from './demoGraph'
import {NodeGraphFlattened, TextNode} from '../../../common/nodeGraphModel'


export const nodesSlice = createSlice({
  name: 'nodes',
  initialState: flatten(demoGraph),
  reducers: {
    nodeGraphLoaded: (state, action: PayloadAction<NodeGraphFlattened>) => {
      // Delete all existing nodes
      Object.keys(state).forEach(nodeId => {
        delete state[nodeId]
      })
      // Add all new nodes
      Object.keys(action.payload).forEach(nodeId => {
        state[nodeId] = action.payload[nodeId]
      })
    },
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
    nodeMoved: (state, action: PayloadAction<{ nodeId: string, newParentId: string, newIndex: number }>) => {
      const node = state[action.payload.nodeId]!
      const oldParent = getParentNode(state, node)
      if (!oldParent) {
        throw Error(`Can't move root node ${action.payload.nodeId}`)
      }
      const newParent = state[action.payload.newParentId]!
      if (newParent.type !== 'text') {
        throw Error(`Can't move node ${action.payload.nodeId} to non-text node ${action.payload.newParentId}`)
      }
      moveNodes(state, [action.payload.nodeId], action.payload.newParentId, action.payload.newIndex)
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
        node.expanded = true
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
  nodeGraphLoaded,
  titleUpdated,
  nodeIndexChanged,
  nodeMoved,
  nodeSplit,
  nodeExpandedChanged,
  nodesMerged,
} = nodesSlice.actions
