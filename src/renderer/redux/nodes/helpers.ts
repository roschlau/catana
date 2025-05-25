import {Node, NodeId, NodeReference} from '../../../common/nodeGraphModel'

export type ResolvedNodeReference = {
  node: Node,
  parentInfo?: {
    parent: Node,
    childIndex: number,
    /** Shorthand equivalent `parent.content[childIndex]` */
    childRef: Node['content'][number],
  },
}

export function resolveNodeRef(
  state: Partial<Record<NodeId, Node>>,
  nodeRef: NodeReference,
): ResolvedNodeReference {
  const node = state[nodeRef.nodeId]!
  const parentInfo = nodeRef.parentId
    ? getViewContext(state[nodeRef.parentId]!, nodeRef.nodeId)
    : undefined
  return { node, parentInfo }
}

function getViewContext(parent: Node, childId: NodeId): NonNullable<ResolvedNodeReference['parentInfo']> {
  const contentChildIndex = parent.content.findIndex(it => it.nodeId === childId)
  if (contentChildIndex === -1) {
    throw Error(`Invalid reference: ${childId} is not a child of ${parent.id}`)
  }
  return {
    parent: parent,
    childIndex: contentChildIndex,
    childRef: parent.content[contentChildIndex],
  }
}

export function deleteNode(state: Partial<Record<NodeId, Node>>, nodeRef: NodeReference, moveLinksTo: NodeId): void {
  // Remove from parent's children
  const { node, parentInfo } = resolveNodeRef(state, nodeRef)
  const {parent, childIndex} = parentInfo!
  parent.content.splice(childIndex, 1)
  // Move any remaining links
  findBacklinks(state, node.id)
    .forEach(childReference => {
      childReference.nodeId = moveLinksTo
    })
  delete state[node.id]
}

export function findBacklinks(state: Partial<Record<NodeId, Node>>, nodeId: NodeId): {
  nodeId: NodeId,
  expanded?: boolean,
}[] {
  return Object.values(state)
    .flatMap((node) => node!.content.filter(child => child.nodeId === nodeId))
}

/**
 * Moves the given node from one parent to another.
 *
 * If the old parent is the owner of the node, the owner will be updated. If the old parent doesn't currently contain
 * the node to be moved, an error will be thrown.
 *
 * If the node to be moved is already linked in the new parent, it will be removed from the old parent and ownership
 * changed as necessary, but no second link will be created in the new parent.
 */
export function moveNode(
  state: Partial<Record<NodeId, Node>>,
  nodeId: NodeId,
  oldParentId: NodeId,
  newParentId: NodeId,
  childIndex: number,
) {
  const node = state[nodeId]!
  const oldParent = state[oldParentId]!
  if (node.ownerId === oldParent.id) {
    // We're moving the canonical instance of the node -> update owner accordingly
    node.ownerId = newParentId
  }
  const { childIndex: currentChildIndex } = getViewContext(oldParent, nodeId)
  // Remove node from old parent
  const childRef = oldParent.content.splice(currentChildIndex, 1)[0]
  // Add node to new parent
  addChildReference(state, nodeId, newParentId, childIndex, childRef.expanded)
}

export function addChildReference(
  state: Partial<Record<NodeId, Node>>,
  childId: NodeId,
  parentId: NodeId,
  atIndex: number,
  expanded: boolean = false,
) {
  const parent = state[parentId]!
  if (parent.content.some(it => it.nodeId === childId)) {
    // Node already linked in old parent, can't link a second time
    return
  }
  parent.content.splice(atIndex, 0, { nodeId: childId, expanded })
}
