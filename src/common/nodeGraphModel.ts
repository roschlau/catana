export type NodeGraphFlattened = Partial<Record<string, Node>>
export type Node = TextNode | NodeLink

// Just an alias to make it easier to spot which strings are supposed to be NodeIDs and which aren't.
// I wish typescript supported nominal typing...
export type NodeId = string

export interface TextNode {
  id: NodeId
  type: 'text'
  title: string
  parentNodeId: NodeId | null
  expanded: boolean
  contentNodeIds: NodeId[]
}

export interface NodeLink {
  type: 'nodeLink'
  id: NodeId
  nodeId: NodeId
  parentNodeId: NodeId | null
  expanded: boolean
}
