import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {clamp} from '../../util/math'
import {addChildReference, deleteNode, moveNode, resolveNodeRef} from './helpers'
import {demoGraph, flatten} from './demoGraph'
import {NodeGraphFlattened, NodeId, NodeViewWithParent} from '../../../common/nodeGraphModel'

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
    nodeCreated: (state, action: PayloadAction<{
      nodeId: NodeId,
      title: string,
      ownerId: NodeId,
      indexInOwner: number
    }>) => {
      const node = action.payload
      state[action.payload.nodeId] = {
        id: action.payload.nodeId,
        title: action.payload.title,
        ownerId: action.payload.ownerId,
        content: [],
      }
      addChildReference(state, node.nodeId, node.ownerId, node.indexInOwner, false)
    },
    titleUpdated: (state, action: PayloadAction<{ nodeId: NodeId, title: string }>) => {
      const node = state[action.payload.nodeId]!
      if (action.payload.title.includes('\n')) {
        console.warn(`Stripping newline from updated title of node ${action.payload.nodeId}`)
        action.payload.title = action.payload.title.replace(/\n/g, '')
      }
      node.title = action.payload.title
    },
    nodeExpandedChanged: (state, action: PayloadAction<{ nodeView: NodeViewWithParent, expanded: boolean }>) => {
      const { viewContext } = resolveNodeRef(state, action.payload.nodeView)
      const { parent, childIndex } = viewContext
      parent.content[childIndex].expanded = action.payload.expanded
    },
    nodeIndexChanged: (state, action: PayloadAction<{ nodeView: NodeViewWithParent, indexChange: number }>) => {
      const { node, viewContext } = resolveNodeRef(state, action.payload.nodeView)
      const parentNode = viewContext.parent
      const { childIndex: currentChildIndex } = viewContext
      const newIndex = clamp(currentChildIndex + action.payload.indexChange, 0, parentNode.content.length - 1)
      moveNode(state, node.id, viewContext.parent.id, viewContext.parent.id, newIndex)
    },
    nodeMoved: (state, action: PayloadAction<{
      nodeView: NodeViewWithParent,
      newParentId: NodeId,
      newIndex: number
    }>) => {
      const { nodeView: { nodeId, parent }, newParentId, newIndex } = action.payload
      moveNode(state, nodeId, parent.nodeId, newParentId, newIndex)
    },
    /**
     * Merges the second node into the first node by appending the second node's title, prepending its children, and
     * moving any links to it to the first node.
     */
    nodesMerged: (state, action: PayloadAction<{ firstNodeId: NodeId, secondNodeRef: NodeViewWithParent }>) => {
      const firstNode = state[action.payload.firstNodeId]!
      const secondNode = state[action.payload.secondNodeRef.nodeId]!
      // Merge titles
      firstNode.title += secondNode.title
      // Merge children
      secondNode.content.forEach(child => {
        moveNode(state, child.nodeId, secondNode.id, firstNode.id, 0)
      })
      // Delete second node
      deleteNode(state, action.payload.secondNodeRef, firstNode.id)
    },
  },
})

export const {
  nodeGraphLoaded,
  titleUpdated,
  nodeIndexChanged,
  nodeMoved,
  nodeCreated,
  nodeExpandedChanged,
  nodesMerged,
} = nodesSlice.actions
