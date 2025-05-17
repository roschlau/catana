import {createSelector, createSlice, nanoid, PayloadAction} from '@reduxjs/toolkit'
import {RootState} from './store'

// Define the TS type for the counter slice's state
export interface NodeState {
  id: string
  title: string
  ownerNodeId: string | null
  /**
   * A list of Node IDs that are nested under this node. This list _might_ be incomplete if there are nodes that are
   * owned by this node, but have for some reason not been added to this array. Those nodes need to be implicitly
   * appended to this list to get the full content of this node. `selectContentNodeIds` does that for you.
   */
  contentNodeIds: string[]
}

export const ROOT_NODE = '_root'

const initialState: Partial<Record<string, NodeState>> = {
  // TODO dummy data
  [ROOT_NODE]: {
    id: ROOT_NODE,
    title: '_root: Root Node',
    ownerNodeId: null,
    contentNodeIds: ['1', '2', '3'],
  },
  '1': {
    id: '1',
    title: '1: Node with ID 1 and a very long title that should probably wrap around to the next line.',
    ownerNodeId: ROOT_NODE,
    contentNodeIds: ['2'],
  },
  '2': {
    id: '2',
    title: '2: Node that is linked in multiple places',
    ownerNodeId: '1',
    contentNodeIds: [],
  },
  '3': {
    id: '3',
    title: '3: Another Node',
    ownerNodeId: ROOT_NODE,
    contentNodeIds: [],
  },
}


export const nodesSlice = createSlice({
  name: 'nodes',
  initialState,
  reducers: {
    titleUpdated: (state, action: PayloadAction<{ nodeId: string, title: string }>) => {
      state[action.payload.nodeId]!.title = action.payload.title
    },
    nodeIndented: (state, action: PayloadAction<{ nodeId: string, currentParentId: string }>) => {
      const oldParent = state[action.payload.currentParentId]!
      const oldSiblings = oldParent.contentNodeIds
      const oldSiblingIndex = oldSiblings.indexOf(action.payload.nodeId)
      if (oldSiblingIndex === 0) {
        // Can't indent node that doesn't have a preceding sibling because that would skip indentation levels
        return
      }
      const newParentId = oldSiblings[oldSiblingIndex - 1]
      const newParent = state[newParentId]!
      const newSiblings = newParent.contentNodeIds
      const indexUnderNewParent = newSiblings.length
      newSiblings.splice(indexUnderNewParent, 0, action.payload.nodeId)
      oldSiblings.splice(oldSiblingIndex, 1)
      const node = state[action.payload.nodeId]!
      if (node.ownerNodeId === oldParent.id) {
        // We're moving the actual node and not a link, so we need to update the owner node ID
        node.ownerNodeId = newParentId
      }
    },
    nodeOutdented: (state, action: PayloadAction<{ nodeId: string, currentParentId: string }>) => {
      const oldParent = state[action.payload.currentParentId]!
      const newParentId = oldParent.ownerNodeId
      if (!newParentId) {
        // Already on root level, can't outdent further
        return
      }
      const newParent = state[newParentId]!
      const oldParentIndex = newParent.contentNodeIds.indexOf(oldParent.id)
      const newSiblingIndex = oldParentIndex + 1
      const oldSiblingIndex = oldParent.contentNodeIds.indexOf(action.payload.nodeId)
      oldParent.contentNodeIds.splice(oldSiblingIndex, 1)
      newParent.contentNodeIds.splice(newSiblingIndex, 0, action.payload.nodeId)
      const node = state[action.payload.nodeId]!
      if (node.ownerNodeId === oldParent.id) {
        // We're moving the actual node and not a link, so we need to update the owner node ID
        node.ownerNodeId = newParentId
      }
    },
  },
})

export const { titleUpdated, nodeIndented, nodeOutdented } = nodesSlice.actions

export const selectNode = (nodeId: string) => (state: RootState) => state.nodes[nodeId]

export const selectContentNodeIds = createSelector(
  [
    (state: RootState) => state.nodes,
    (_: RootState, nodeId: string) => nodeId,
  ],
  (nodes, nodeId) => {
    const explicitContent = nodes[nodeId]!.contentNodeIds
    const explicitIDsSet = new Set(explicitContent)
    const implicitContent = Object.values(nodes)
      .filter(node => node.ownerNodeId === nodeId && !explicitIDsSet.has(node.id))
      .map(node => node.id)
    return [...explicitContent, ...implicitContent]
  },
)

export default nodesSlice.reducer
