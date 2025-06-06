import {DocView, DocViewWithParent, ParentNodeView} from '@/common/doc-views'
import {Doc, DocGraphFlattened, DocOfType, Id, Node, Property} from '@/common/docs'

export type DocWithContext<T extends Doc> = {
  node: T,
  viewContext?: {
    parentView: ParentNodeView,
    parent: Node | Property,
    childIndex: number,
    isExpanded: boolean,
  },
}

export function getDoc<T extends Doc['type']>(
  state: DocGraphFlattened,
  nodeId: Id<T>,
): DocOfType<T> {
  const doc = state[nodeId]
  if (!doc) {
    throw new Error(`Node ${nodeId} not found`)
  }
  return doc as DocOfType<T>
}

export function resolveDocRef<T extends Doc>(state: DocGraphFlattened, nodeRef: DocViewWithParent<T>): Required<DocWithContext<T>>
export function resolveDocRef<T extends Doc>(state: DocGraphFlattened, nodeRef: DocView<T>): DocWithContext<T>
export function resolveDocRef<T extends Doc>(
  state: DocGraphFlattened,
  nodeRef: DocView<T>,
): DocWithContext<T> {
  const node = getDoc(state, nodeRef.nodeId) as T
  const viewContext = nodeRef.parent
    ? { ...getViewContext(getDoc(state, nodeRef.parent.nodeId), nodeRef.nodeId), parentView: nodeRef.parent }
    : undefined
  return { node, viewContext }
}

export function findBacklinks(state: DocGraphFlattened, nodeId: Doc['id']): Node['content'] {
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
