import {Node, NodeLink, ResolvedNode, TextNode} from './nodesSlice'
import {isPresent} from '../../util/optionals'

/**
 * Returns an object containing the non-link node that the given nodeId points to. If the given node is already a
 * non-link node, it is returned directly as the `node` property. If the given node is a link node, then it will be
 * available in the `link` property, and the `node` property will be the node that the link points to.
 */
export function resolveNode(state: Partial<Record<string, Node>>, nodeId: string): ResolvedNode {
  const node = state[nodeId]
  if (!node) {
    throw Error(`Node ${nodeId} doesn't exist`)
  }
  if (node.type !== 'nodeLink') {
    return { node }
  }
  const linkedNode = state[node.nodeId]!
  if (linkedNode.type === 'nodeLink') {
    throw Error(`Link node ${node.nodeId} points to another link node ${linkedNode.nodeId}. This is not supported.`)
  }
  return { node: linkedNode, link: node }
}

export function getParentNode(state: Partial<Record<string, Node>>, node: Node): TextNode | null {
  const parentNodeId = node.parentNodeId
  if (!parentNodeId) {
    return null
  }
  const parentNode = state[parentNodeId]!
  if (parentNode.type === 'nodeLink') {
    // Currently, node links can't have children, so if this happens, we got a bug somewhere or someone messed with the
    // saved state manually. This might change in the future - we could add support for node links having child nodes
    // that are nested under them and are separate from the linked node's content.
    throw Error(`Node ${node.id} is illegally owned by a Node Link (${parentNode.id}).`)
  }
  return parentNode
}

export function deleteNode(state: Partial<Record<string, Node>>, node: Node, moveLinksTo: string): void {
  // Remove from parent's children
  const parent = getParentNode(state, node)!
  parent.contentNodeIds.splice(parent.contentNodeIds.indexOf(node.id), 1)
  // Move any remaining links
  findLinksTo(state, node.id)
    .forEach(link => {
      link.nodeId = moveLinksTo
    })
  delete state[node.id]
}

export function findLinksTo(state: Partial<Record<string, Node>>, nodeId: string): NodeLink[] {
  return Object.values(state)
    .filter(isPresent)
    .filter((node): node is NodeLink => node.type === 'nodeLink' && node.nodeId === nodeId)
}

export function moveNodes(
  state: Partial<Record<string, Node>>,
  nodes: string[],
  newParentId: string,
  childIndex: number,
): void {
  // Defensive copy because if all nodes of a specific parent are moved, then `nodes` is likely to be the same array
  // as `parent.contentNodeIds` that we're splicing in the forEach loop below. Without the defensive copy, that would
  // cause concurrent modifications and spectacularly break the consistency of the node tree.
  const nodesToMove = [...nodes]
  nodesToMove.forEach(nodeId => {
    const node = state[nodeId]!
    const parent = getParentNode(state, node)!
    const childIndex = parent.contentNodeIds.indexOf(nodeId)
    parent.contentNodeIds.splice(childIndex, 1)
    node.parentNodeId = newParentId
  })
  const newParent = resolveNode(state, newParentId).node
  newParent.contentNodeIds.splice(childIndex, 0, ...nodesToMove)
}
