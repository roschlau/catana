export type NodeGraphFlattened = Partial<Record<string, Node>>

// Just an alias to make it easier to spot which strings are supposed to be NodeIDs and which aren't.
// I wish typescript supported nominal typing...
export type NodeId = string

export interface Node {
  id: NodeId
  title: string
  ownerId: NodeId | null
  content: {
    nodeId: NodeId,
    expanded?: boolean,
  }[]
}

/**
 * Identifies a specific node, optionally at a specific position in the graph
 */
export interface NodeReference {
  nodeId: NodeId,
  parentId?: NodeId,
}
