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

export type NodeViewWithParent = Required<NodeView>

/** Identifies a node being viewed at a specific point in the Node graph. */
export interface NodeView {
  nodeId: NodeId,
  parent?: NodeView,
}

/** Checks whether the passed NodeView contains any of the nodes within it more than once. */
export function isRecursive(nodeView: NodeView): boolean {
  const seenIds = new Set<NodeId>()
  let next: NodeView | undefined = nodeView
  while (next !== undefined) {
    if (seenIds.has(next.nodeId)) {
      return true
    }
    seenIds.add(next.nodeId)
    next = next.parent
  }
  return false
}

/** Checks recursively if the passed NodeViews correspond to the same view. */
export function isSameView(a: NodeView | undefined, b: NodeView | undefined): boolean {
  if (a === undefined || b === undefined) {
    return a === undefined && b === undefined
  }
  return a.nodeId === b.nodeId && isSameView(a.parent, b.parent)
}
