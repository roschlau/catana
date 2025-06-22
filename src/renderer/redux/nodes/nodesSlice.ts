import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit'
import {clamp} from '../../util/math'
import {getNode, getViewContext, resolveNodeView} from './helpers'
import {addChildReference, deleteNodeAfterMerge, deleteNodeTree, moveNode, removeChildReference} from './stateMutations'
import {CheckboxConfig} from '@/common/checkboxes'
import {Id, Node, NodeGraphFlattened, ParentNode, TextNode} from '@/common/nodes'
import {NodeViewWithParent} from '@/common/node-views'
import {RootState} from '@/renderer/redux/store'

export const nodesSlice = createSlice({
  name: 'nodes',
  initialState: {} satisfies NodeGraphFlattened as NodeGraphFlattened,
  reducers: {
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
        },
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
      const { viewContext } = resolveNodeView(state, action.payload.nodeView)
      const { parent, childIndex } = viewContext
      parent.content[childIndex].expanded = action.payload.expanded
    },
    nodeIndexChanged: (state, action: PayloadAction<{ nodeView: NodeViewWithParent<Node>, indexChange: number }>) => {
      const { node, viewContext } = resolveNodeView(state, action.payload.nodeView)
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
    nodesMerged: (
      state,
      action: PayloadAction<{ firstNodeId: Id<'node'>, secondNodeView: NodeViewWithParent<TextNode> }>,
    ) => {
      const firstNode = getNode(state, action.payload.firstNodeId)
      const secondNode = getNode(state, action.payload.secondNodeView.nodeId)
      // Merge titles
      firstNode.title += secondNode.title
      firstNode.history.lastModifiedTime = new Date().getTime()
      // Move children
      secondNode.content.forEach(child => {
        moveNode(state, child.nodeId, secondNode.id, firstNode.id, 0)
      })
      // Delete second node
      deleteNodeAfterMerge(state, action.payload.secondNodeView, firstNode.id)
    },
    checkboxUpdated: (state, action: PayloadAction<{ nodeId: Id<'node'>, checkbox: CheckboxConfig | undefined }>) => {
      getNode(state, action.payload.nodeId).checkbox = action.payload.checkbox
    },
    nodeLinkRemoved: (state, action: PayloadAction<{ nodeView: NodeViewWithParent<Node> }>) => {
      const { node, viewContext } = resolveNodeView(state, action.payload.nodeView)
      if (node.ownerId === viewContext.parent.id) {
        throw new Error(`Can't remove link to ${node.id} from owner node ${viewContext.parent.id}`)
      }
      removeChildReference(state, node.id, viewContext.parent.id)
    },
    nodeTreeDeleted: (state, action: PayloadAction<{ nodeId: Node['id'] }>) => {
      const node = getNode(state, action.payload.nodeId)
      if (node.ownerId) {
        const owner = getNode(state, node.ownerId)
        const { parent, childIndex } = getViewContext(owner, node.id)
        parent.content.splice(childIndex, 1)
      }
      deleteNodeTree(state, action.payload.nodeId)
    },
    nodeTreeAdded: (state, action: PayloadAction<{
      graph: NodeGraphFlattened,
      root: Id<'node'>,
      parent: ParentNode['id'],
      index?: number,
    }>) => {
      Object.assign(state, action.payload.graph)
      const rootNode = getNode(state, action.payload.root)
      const parentNode = getNode(state, action.payload.parent)
      rootNode.ownerId = parentNode.id
      const childRef = { nodeId: rootNode.id, expanded: true }
      if (action.payload.index) {
        parentNode.content.splice(action.payload.index, 0, childRef)
      } else {
        parentNode.content.push(childRef)
      }
    },
  },
})

export const selectNodes = createSelector([
  (state: RootState) => state.undoable.present.nodes,
  (_: RootState, query: string) => query,
], (nodes, query) => {
  return Object.values(nodes)
    .filter((node): node is TextNode => node?.type === 'node' && node.title.toLowerCase().includes(query.toLowerCase()))
})

export const {
  titleUpdated,
  nodeIndexChanged,
  nodeMoved,
  nodeCreated,
  nodeExpandedChanged,
  nodesMerged,
  checkboxUpdated,
  nodeLinkRemoved,
  nodeTreeDeleted,
  nodeTreeAdded,
} = nodesSlice.actions
