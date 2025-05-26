import {Id, Node, NodeView, NodeViewWithParent} from '../../../common/nodeGraphModel'

export type NodeWithContext = {
  node: Node,
  viewContext?: {
    parentView: NodeView,
    parent: Node,
    childIndex: number,
    isExpanded: boolean,
  },
}

export function resolveNodeRef(state: Partial<Record<Id<'node'>, Node>>, nodeRef: NodeViewWithParent): Required<NodeWithContext>
export function resolveNodeRef(state: Partial<Record<Id<'node'>, Node>>, nodeRef: NodeView): NodeWithContext
export function resolveNodeRef(
  state: Partial<Record<Id<'node'>, Node>>,
  nodeRef: NodeView,
): NodeWithContext {
  const node = state[nodeRef.nodeId]!
  const viewContext = nodeRef.parent
    ? { ...getViewContext(state[nodeRef.parent.nodeId]!, nodeRef.nodeId), parentView: nodeRef.parent }
    : undefined
  return { node, viewContext }
}

export function findBacklinks(state: Partial<Record<Id<'node'>, Node>>, nodeId: Id<'node'>): Node['content'] {
  return Object.values(state)
    .flatMap((node) => node!.content.filter(child => child.nodeId === nodeId))
}

export function getViewContext(parent: Node, childId: Id<'node'>) {
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
