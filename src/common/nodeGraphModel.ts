export type NodeGraphFlattened = Partial<Record<string, Node>>

/**
 * Alias for string, but typed in a way to ensure we can't accidentally cross-assign IDs of a certain type with IDs of
 * other types, or even strings. If you actually need to convert a string into an ID, you can use `str as Id<'type'>`.
 *
 * Inspiration for this approach taken from here: https://michalzalecki.com/nominal-typing-in-typescript/#approach-4-intersection-types-and-brands
 */
export type Id<T extends IdTypes> = string & { __brand: T }
export type IdTypes =
  | 'node'

export interface Node {
  id: Id<'node'>
  title: string
  ownerId: Id<'node'> | null
  content: {
    nodeId: Id<'node'>,
    expanded?: boolean,
  }[]
}

export type NodeViewWithParent = Required<NodeView>

/** Identifies a node being viewed at a specific point in the Node graph. */
export interface NodeView {
  nodeId: Id<'node'>,
  parent?: NodeView,
}

/** Checks whether the passed NodeView contains any of the nodes within it more than once. */
export function isRecursive(nodeView: NodeView): boolean {
  const seenIds = new Set<Id<'node'>>()
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
