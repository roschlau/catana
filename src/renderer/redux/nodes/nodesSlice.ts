import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {clamp} from '../../util/math'
import {getNode, resolveNodeRef} from './helpers'
import {demoGraph} from '../../../common/demoGraph'
import {addChildReference, deleteNodeAfterMerge, moveNode} from './stateMutations'
import {CheckboxConfig} from '@/common/checkboxes'
import {Id, Node, NodeGraphFlattened, ParentNode, TextNode} from '@/common/nodes'
import {flatten} from '@/common/node-tree'
import {NodeViewWithParent} from '@/common/node-views'

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
      nodeId: Id<'node'>,
      title: string,
      ownerId: ParentNode['id'],
      indexInOwner: number
    }>) => {
      const nodeData = action.payload
      const now = new Date().getTime()
      const node: TextNode = {
        id: action.payload.nodeId,
        type: 'node',
        title: action.payload.title,
        ownerId: action.payload.ownerId,
        content: [],
        history: {
          createdTime: now,
          lastModifiedTime: now,
        }
      }
      state[action.payload.nodeId] = node
      addChildReference(state, node.id, nodeData.ownerId, nodeData.indexInOwner, false)
    },
    titleUpdated: (state, action: PayloadAction<{ nodeId: Id<'node'>, title: string }>) => {
      const node = getNode(state, action.payload.nodeId)
      if (action.payload.title.includes('\n')) {
        console.warn(`Stripping newline from updated title of node ${action.payload.nodeId}`)
        action.payload.title = action.payload.title.replace(/\n/g, '')
      }
      node.title = action.payload.title
      node.history.lastModifiedTime = new Date().getTime()
    },
    nodeExpandedChanged: (state, action: PayloadAction<{ nodeView: NodeViewWithParent<Node>, expanded: boolean }>) => {
      const { viewContext } = resolveNodeRef(state, action.payload.nodeView)
      const { parent, childIndex } = viewContext
      parent.content[childIndex].expanded = action.payload.expanded
    },
    nodeIndexChanged: (state, action: PayloadAction<{ nodeView: NodeViewWithParent<Node>, indexChange: number }>) => {
      const { node, viewContext } = resolveNodeRef(state, action.payload.nodeView)
      const parentNode = viewContext.parent
      const { childIndex: currentChildIndex } = viewContext
      const newIndex = clamp(currentChildIndex + action.payload.indexChange, 0, parentNode.content.length - 1)
      moveNode(state, node.id, viewContext.parent.id, viewContext.parent.id, newIndex)
    },
    nodeMoved: (state, action: PayloadAction<{
      nodeView: NodeViewWithParent<Node>,
      newParentId: ParentNode['id'],
      newIndex: number
    }>) => {
      const { nodeView: { nodeId, parent }, newParentId, newIndex } = action.payload
      moveNode(state, nodeId, parent.nodeId, newParentId, newIndex)
    },
    /**
     * Merges the second node into the first node by appending the second node's title, prepending its children, and
     * moving any links to it to the first node.
     */
    nodesMerged: (state, action: PayloadAction<{ firstNodeId: Id<'node'>, secondNodeRef: NodeViewWithParent<TextNode> }>) => {
      const firstNode = getNode(state, action.payload.firstNodeId)
      const secondNode = getNode(state, action.payload.secondNodeRef.nodeId)
      // Merge titles
      firstNode.title += secondNode.title
      firstNode.history.lastModifiedTime = new Date().getTime()
      // Move children
      secondNode.content.forEach(child => {
        moveNode(state, child.nodeId, secondNode.id, firstNode.id, 0)
      })
      // Delete second node
      deleteNodeAfterMerge(state, action.payload.secondNodeRef, firstNode.id)
    },
    checkboxUpdated: (state, action: PayloadAction<{ nodeId: Id<'node'>, checkbox: CheckboxConfig | undefined }>) => {
      getNode(state, action.payload.nodeId).checkbox = action.payload.checkbox
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
  checkboxUpdated,
} = nodesSlice.actions
