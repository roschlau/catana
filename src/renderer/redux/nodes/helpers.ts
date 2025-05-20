import {Node, ResolvedNode, TextNode} from './nodesSlice'

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
