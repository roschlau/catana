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
    ? getParentInfo(state[nodeRef.parentId]!, nodeRef.nodeId)
    : undefined
  return { node, parentInfo: parentInfo }
}

function getParentInfo(parent: Node, childId: NodeId): ResolvedNodeReference['parentInfo'] {
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

export function moveNodeRefs(
  state: Partial<Record<NodeId, Node>>,
  nodes: NodeReference[],
  newParentId: NodeId,
  childIndex: number,
): void {
  // Defensive copy because if all nodes of a specific parent are moved, then `nodes` is likely to be the same array
  // as `parent.content` that we're splicing in the forEach loop below. Without the defensive copy, that would
  // cause concurrent modifications and spectacularly break the consistency of the node tree.
  const nodesToMove = [...nodes]
  // Remove nodes from their old parents
  const childRefs = nodesToMove.flatMap(nodeRef => {
    const { node, parentInfo } = resolveNodeRef(state, nodeRef)
    const parent = parentInfo!.parent
    const childIndex = parentInfo!.childIndex
    if (node.ownerId === parent.id) {
      // This is the actual owner of the node, so we need to update that as well
      node.ownerId = newParentId
    }
    return parent.content.splice(childIndex, 1)
  })
  // Add nodes to the new parent
  const newParent = state[newParentId]!
  const nonDuplicateNodes = childRefs.filter(nodeRef => !newParent.content.some(it => it.nodeId === nodeRef.nodeId))
  newParent.content.splice(childIndex, 0, ...nonDuplicateNodes)
}
