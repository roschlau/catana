import {Doc, ParentDoc} from '@/common/docs'

/**
 * A node view that definitely has a parent
 */
export type DocViewWithParent<T extends Doc> = Required<DocView<T>>

/**
 * A node view of a node that can potentially be a parent for other nodes.
 */
export type ParentNodeView = DocView<ParentDoc>

/** Identifies a node being viewed at a specific point in the Node graph. */
export interface DocView<T extends Doc> {
  nodeId: T['id'],
  parent?: ParentNodeView,
}

/** Checks whether the passed NodeView contains any of the nodes within it more than once. */
export function isRecursive(nodeView: DocView<Doc>): boolean {
  const seenIds = new Set<Doc['id']>()
  let next: DocView<Doc> | undefined = nodeView
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
export function isSameView(a: DocView<Doc> | undefined, b: DocView<Doc> | undefined): boolean {
  if (a === undefined || b === undefined) {
    return a === undefined && b === undefined
  }
  return a.nodeId === b.nodeId && isSameView(a.parent, b.parent)
}
