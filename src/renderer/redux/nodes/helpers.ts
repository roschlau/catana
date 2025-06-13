import {NodeView, NodeViewWithParent, ParentNodeView} from '@/common/node-views'
import {Id, Node, NodeGraphFlattened, NodeOfType, Property, TextNode} from '@/common/nodes'

export type NodeWithContext<T extends Node> = {
  node: T,
  viewContext?: {
    parentView: ParentNodeView,
    parent: TextNode | Property,
    childIndex: number,
    isExpanded: boolean,
  },
}

export function getNode<T extends Node['type']>(
  state: NodeGraphFlattened,
  nodeId: Id<T>,
): NodeOfType<T> {
  const node = state[nodeId]
  if (!node) {
    throw new Error(`Node ${nodeId} not found`)
  }
  return node as NodeOfType<T>
}

export function resolveNodeRef<T extends Node>(state: NodeGraphFlattened, nodeRef: NodeViewWithParent<T>): Required<NodeWithContext<T>>
export function resolveNodeRef<T extends Node>(state: NodeGraphFlattened, nodeRef: NodeView<T>): NodeWithContext<T>
export function resolveNodeRef<T extends Node>(
  state: NodeGraphFlattened,
  nodeRef: NodeView<T>,
): NodeWithContext<T> {
  const node = getNode(state, nodeRef.nodeId) as T
  const viewContext = nodeRef.parent
    ? { ...getViewContext(getNode(state, nodeRef.parent.nodeId), nodeRef.nodeId), parentView: nodeRef.parent }
    : undefined
  return { node, viewContext }
}

export function findBacklinks(state: NodeGraphFlattened, nodeId: Node['id']): TextNode['content'] {
  return Object.values(state)
    .flatMap((node) => {
      if (node!.type === 'field') {
        return []
      }
      return node!.content.filter(child => child.nodeId === nodeId)
    })
}

export function getViewContext(parent: TextNode | Property, childId: Node['id']) {
  const contentChildIndex = parent.content.findIndex(it => it.nodeId === childId)
  if (contentChildIndex === -1) {
    throw Error(`Invalid reference: ${childId} is not a child of ${parent.id}`)
  }
  return {
    parent,
    childIndex: contentChildIndex,
    isExpanded: parent.content[contentChildIndex].expanded ?? false,
  }
}
