export type NodeGraphFlattened = Partial<Record<string, Doc>>

/**
 * Alias for string, but typed in a way to ensure we can't accidentally cross-assign IDs of a certain type with IDs of
 * other types, or even strings. If you actually need to convert a string into an ID, you can use `str as Id<'type'>`.
 *
 * Inspiration for this approach taken from here: https://michalzalecki.com/nominal-typing-in-typescript/#approach-4-intersection-types-and-brands
 */
export type Id<T extends DocType> = string & { __brand: T }
export type DocType = Doc['type']

export function id<T extends DocType>(id: string): Id<T> {
  return id as Id<T>
}

// TODO possibly replace the above ID approach with something like this to make it runtime-checkable:
// export type DocReference = Pick<Doc, 'id' | 'type'>

export type Doc =
  | Node
  | Property
  | Field

/**
 * Covers all node types that can contain other nodes as children.
 */
export type ParentDoc =
  | Node
  | Property

/**
 * True if the passed doc is of a type that allows it to contain children.
 * @deprecated Try to use the type system.
 */
export function isParentDoc(doc: Doc): doc is ParentDoc {
  return doc.type === 'node' || doc.type === 'property'
}

export interface Node {
  id: Id<'node'>
  type: 'node'
  title: string
  ownerId: ParentDoc['id'] | null
  content: {
    nodeId: Doc['id'],
    expanded?: boolean,
  }[]
}

export interface Property {
  id: Id<'property'>
  type: 'property'
  ownerId: Id<'node'>
  content: [
    { nodeId: Id<'field'>, expanded?: boolean }, // Field definition
    ...{ nodeId: Id<'node'>, expanded?: boolean }[], // Property values
  ]
}

export interface Field {
  id: Id<'field'>
  type: 'field'
  title: string
  ownerId: Id<'node'>
}

/**
 * A node view that definitely has a parent
 */
export type NodeViewWithParent = Required<NodeView>

/**
 * A node view of a node that can potentially be a parent for other nodes.
 */
export type ParentNodeView = NodeView & { nodeId: ParentDoc['id'] }

/** Identifies a node being viewed at a specific point in the Node graph. */
export interface NodeView {
  nodeId: Doc['id'],
  parent?: ParentNodeView,
}

/** Checks whether the passed NodeView contains any of the nodes within it more than once. */
export function isRecursive(nodeView: NodeView): boolean {
  const seenIds = new Set<Doc['id']>()
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
