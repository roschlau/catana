export type NodeGraphFlattened = Partial<Record<string, Node>>
export type Node = TextNode | NodeLink

export interface TextNode {
  id: string
  type: 'text'
  title: string
  parentNodeId: string | null
  expanded: boolean
  contentNodeIds: string[]
}

export interface NodeLink {
  type: 'nodeLink'
  id: string
  nodeId: string
  parentNodeId: string | null
  expanded: boolean
}
