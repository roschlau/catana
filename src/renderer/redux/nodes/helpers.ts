import {
  Doc,
  Id,
  Node,
  NodeGraphFlattened,
  NodeView,
  NodeViewWithParent,
  ParentNodeView,
  Property,
} from '@/common/nodeGraphModel'

export type NodeWithContext = {
  node: Doc,
  viewContext?: {
    parentView: ParentNodeView,
    parent: Node | Property,
    childIndex: number,
    isExpanded: boolean,
  },
}

type DocOfType<T extends Doc['type']> = Doc & { type: T }

export function getDoc<T extends Doc['type']>(
  state: NodeGraphFlattened,
  nodeId: Id<T>,
): DocOfType<T> {
  const doc = state[nodeId]
  if (!doc) {
    throw new Error(`Node ${nodeId} not found`)
  }
  return doc as DocOfType<T>
}

export function resolveDocRef(state: NodeGraphFlattened, nodeRef: NodeViewWithParent): Required<NodeWithContext>
export function resolveDocRef(state: NodeGraphFlattened, nodeRef: NodeView): NodeWithContext
export function resolveDocRef(
  state: NodeGraphFlattened,
  nodeRef: NodeView,
): NodeWithContext {
  const node = getDoc(state, nodeRef.nodeId)
  const viewContext = nodeRef.parent
    ? { ...getViewContext(getDoc(state, nodeRef.parent.nodeId), nodeRef.nodeId), parentView: nodeRef.parent }
    : undefined
  return { node, viewContext }
}

export function findBacklinks(state: NodeGraphFlattened, nodeId: Doc['id']): Node['content'] {
  return Object.values(state)
    .flatMap((node) => {
      if (node!.type === 'field') {
        return []
      }
      return node!.content.filter(child => child.nodeId === nodeId)
    })
}

export function getViewContext(parent: Node | Property, childId: Doc['id']) {
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
