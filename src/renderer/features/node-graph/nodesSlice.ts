import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit'
import {clamp} from '../../util/math'
import {getNode, getViewContext, resolveNodeView} from './helpers'
import {
  addChildReferences,
  deleteNodeAfterMerge,
  deleteNodeTree,
  moveNode,
  removeChildReference,
} from './stateMutations'
import {CheckboxState} from '@/common/checkboxes'
import {CheckboxHistoryEntry, Id, Node, NodeGraphFlattened, ParentNode, TextNode} from '@/common/nodes'
import {NodeView, NodeViewWithParent} from '@/common/node-views'
import {AppState} from '@/renderer/redux/store'

export const nodesSlice = createSlice({
  name: 'nodes',
  initialState: {} satisfies NodeGraphFlattened as NodeGraphFlattened,
  reducers: {
    nodeCreated: (state, action: PayloadAction<{
      nodeId: Id<'node'>,
      title: string,
      ownerId: ParentNode['id'],
      indexInOwner: number
      checkbox?: CheckboxState,
    }>) => {
      const nodeData = action.payload
      const now = new Date().getTime()
      const node: TextNode = {
        id: action.payload.nodeId,
        type: 'node',
        title: action.payload.title,
        ownerId: action.payload.ownerId,
        checkbox: action.payload.checkbox,
        content: [],
        history: {
          createdTime: now,
          lastModifiedTime: now,
        },
      }
      state[action.payload.nodeId] = node
      addChildReferences(state, [node.id], nodeData.ownerId, nodeData.indexInOwner, false)
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
    checkboxUpdated: (state, action: PayloadAction<{
      nodeId: Id<'node'>,
      state: CheckboxState | null
    }>) => {
      const node = getNode(state, action.payload.nodeId)
      if (action.payload.state === null) {
        delete node.checkbox
      } else {
        node.checkbox = action.payload.state
      }
      const historyEntry: CheckboxHistoryEntry = [new Date().getTime(), action.payload.state]
      const lastEntryTime = node.history.checkbox?.[0]?.[0]
      if (lastEntryTime && lastEntryTime > historyEntry[0] - 1000) {
        // User is cycling through states quickly, so replace instead of add to prevent unnecessary noise in the history
        node.history.checkbox?.splice(0, 1)
      }
      const lastEntryState = node.history.checkbox?.[0]?.[1]
      if (lastEntryState === action.payload.state) {
        // User cycled through states and arrived at the same one as before. Don't create a new entry in this case.
        return
      }
      node.history.checkbox = [
        historyEntry,
        ...(node.history.checkbox ?? []),
      ]
    },
    nodeLinksAdded: (state, action: PayloadAction<{
      parentId: ParentNode['id'],
      childIds: TextNode['id'][],
      index?: number,
    }>) => {
      const parentNode = getNode(state, action.payload.parentId)
      const index = action.payload.index ?? parentNode.content.length
      addChildReferences(state, action.payload.childIds, parentNode.id, index, false)
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
      if (action.payload.index !== undefined) {
        parentNode.content.splice(action.payload.index, 0, childRef)
      } else {
        parentNode.content.push(childRef)
      }
    },
  },
})

export const selectNodes = createSelector([
  (state: AppState) => state.undoable.present.nodes,
  (_: AppState, query: string) => query,
], (nodes, query) => {
  return Object.values(nodes)
    .filter((node): node is TextNode => node?.type === 'node' && node.title.toLowerCase().includes(query.toLowerCase()))
})

export function selectNodeFromNodeView<T extends Node>(
  state: AppState,
  nodeView: NodeView<T>,
): T {
  return getNode(state.undoable.present.nodes, nodeView.nodeId) as T
}

export const selectIsLink = (
  state: AppState,
  nodeView: NodeViewWithParent<Node>,
) => {
  const node = getNode(state.undoable.present.nodes, nodeView.nodeId)
  return !node.ownerId || node.ownerId !== nodeView.parent.nodeId
}

export const selectIsLastNode = (
  state: AppState,
  nodeView: NodeViewWithParent<Node>,
) => {
  const { viewContext } = resolveNodeView(state.undoable.present.nodes, nodeView)
  return viewContext.childIndex === viewContext.parent.content.length - 1
}

export const {
  titleUpdated,
  nodeIndexChanged,
  nodeMoved,
  nodeCreated,
  nodeExpandedChanged,
  nodesMerged,
  checkboxUpdated,
  nodeLinksAdded,
  nodeLinkRemoved,
  nodeTreeDeleted,
  nodeTreeAdded,
} = nodesSlice.actions
