import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {clamp} from '../../util/math'
import {deleteNode, moveNodeRefs, resolveNodeRef} from './helpers'
import {demoGraph, flatten} from './demoGraph'
import {Node, NodeGraphFlattened, NodeId, NodeReference} from '../../../common/nodeGraphModel'


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
    titleUpdated: (state, action: PayloadAction<{ nodeId: NodeId, title: string }>) => {
      const node = state[action.payload.nodeId]!
      node.title = action.payload.title
    },
    nodeExpandedChanged: (state, action: PayloadAction<{ nodeRef: NodeReference, expanded: boolean }>) => {
      const { parentInfo } = resolveNodeRef(state, action.payload.nodeRef)
      if (!parentInfo) {
        throw Error(`Can't change expansion of root node of current view`)
      }
      parentInfo.childRef.expanded = action.payload.expanded
    },
    nodeIndexChanged: (state, action: PayloadAction<{ nodeRef: NodeReference, indexChange: number }>) => {
      const {node, parentInfo} = resolveNodeRef(state, action.payload.nodeRef)
      if (!parentInfo) {
        throw Error(`Can't change index of node ${node.id} outside of parent context`)
      }
      const parentNode = parentInfo.parent
      const { childRef, childIndex: existingNodeIndex } = parentInfo
      const newIndex = clamp(existingNodeIndex + action.payload.indexChange, 0, parentNode.content.length - 1)
      parentNode.content.splice(existingNodeIndex, 1)
      parentNode.content.splice(newIndex, 0, childRef)
    },
    nodeMoved: (state, action: PayloadAction<{ nodeRef: NodeReference, newParentId: NodeId, newIndex: number }>) => {
      const { parentInfo } = resolveNodeRef(state, action.payload.nodeRef)
      const oldParent = parentInfo?.parent
      if (!oldParent) {
        throw Error(`Can't move root node ${action.payload.nodeRef.nodeId}`)
      }
      moveNodeRefs(state, [action.payload.nodeRef], action.payload.newParentId, action.payload.newIndex)
    },
    nodeSplit: (state, action: PayloadAction<{
      nodeRef: NodeReference,
      newNodeId: NodeId,
      atIndex: number,
      parentId: NodeId
    }>) => {
      const { node, parentInfo } = resolveNodeRef(state, action.payload.nodeRef)
      const newNode: Node = {
        id: action.payload.newNodeId,
        title: node.title.slice(action.payload.atIndex),
        ownerId: action.payload.parentId,
        content: [] as Node['content'],
      }
      state[newNode.id] = newNode
      node.title = node.title.slice(0, action.payload.atIndex)
      if (newNode.ownerId === node.id) {
        // Adding as first child
        node.content.unshift({ nodeId: newNode.id })
        if (parentInfo?.childRef) {
          parentInfo.childRef.expanded = true
        }
      } else {
        // Adding as next sibling
        if (!parentInfo?.parent) {
          throw Error(`Can't split node ${node.id} outside of parent context`)
        }
        const existingNodeIndex = parentInfo.childIndex
        parentInfo.parent.content.splice(existingNodeIndex + 1, 0, { nodeId: newNode.id })
      }
    },
    /**
     * Merges the second node into the first node by appending the second node's title, prepending its children, and
     * moving any links to it to the first node.
     */
    nodesMerged: (state, action: PayloadAction<{ firstNodeId: NodeId, secondNodeRef: NodeReference }>) => {
      const firstNode = state[action.payload.firstNodeId]!
      const secondNode = state[action.payload.secondNodeRef.nodeId]!
      firstNode.title += secondNode.title
      moveNodeRefs(state, secondNode.content.map(it => ({ nodeId: it.nodeId, parentId: secondNode.id })), firstNode.id, 0)
      deleteNode(state, action.payload.secondNodeRef, firstNode.id)
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
