import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit'
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
  },
})

export const { titleUpdated } = nodesSlice.actions

export const selectNode = (nodeId: string) => (state: RootState) => state.nodes[nodeId]

export const selectContentNodeIds = createSelector(
  [
    (state: RootState) => state.nodes,
    (_: RootState, nodeId: string) => nodeId,
  ],
  (nodes, nodeId) => {
    const explicitContent = nodes[nodeId].contentNodeIds
    const explicitIDsSet = new Set(explicitContent)
    const implicitContent = Object.values(nodes)
      .filter(node => node.ownerNodeId === nodeId && !explicitIDsSet.has(node.id))
      .map(node => node.id)
    return [...explicitContent, ...implicitContent]
  },
)

export default nodesSlice.reducer
