import {Node, ParentNode} from '@/common/nodes'

/**
 * A node view that definitely has a parent
 */
export type NodeViewWithParent<T extends Node> = Required<NodeView<T>>

/**
 * A node view of a node that can potentially be a parent for other nodes.
 */
export type ParentNodeView = NodeView<ParentNode>

/** Identifies a node being viewed at a specific point in the Node graph. */
export interface NodeView<T extends Node> {
  nodeId: T['id'],
  parent?: ParentNodeView,
}

/** Checks whether the passed NodeView contains any of the nodes within it more than once. */
export function isRecursive(nodeView: NodeView<Node>): boolean {
  const seenIds = new Set<Node['id']>()
  let next: NodeView<Node> | undefined = nodeView
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
export function isSameView(a: NodeView<Node> | undefined, b: NodeView<Node> | undefined): boolean {
  if (a === undefined || b === undefined) {
    return a === undefined && b === undefined
  }
  return a.nodeId === b.nodeId && isSameView(a.parent, b.parent)
}
