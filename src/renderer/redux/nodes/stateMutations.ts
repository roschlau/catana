import {Doc, Id, NodeViewWithParent, ParentDoc} from '@/common/nodeGraphModel'
import {findBacklinks, getDoc, getViewContext, resolveDocRef} from './helpers'
import {RootState} from '@/renderer/redux/store'

/**
 * Deletes a node and points all parents linking to it to a new node. Specifically intended for the use case of
 * finalizing the merge of two nodes.
 */
export function deleteNodeAfterMerge(
  state: RootState['undoable']['present']['nodes'],
  nodeRef: NodeViewWithParent,
  mergedNode: Id<'node'>,
) {
  // Remove from parent's children
  const { node, viewContext } = resolveDocRef(state, nodeRef)
  const { parent, childIndex } = viewContext!
  parent.content.splice(childIndex, 1)
  // Move any remaining links
  findBacklinks(state, node.id)
    .forEach(childReference => {
      childReference.nodeId = mergedNode
    })
  delete state[node.id]
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
  state: RootState['undoable']['present']['nodes'],
  nodeId: Doc['id'],
  oldParentId: ParentDoc['id'],
  newParentId: ParentDoc['id'],
  childIndex: number,
) {
  const node = getDoc(state, nodeId)
  const oldParent = getDoc(state, oldParentId)
  if (node.ownerId === oldParent.id) {
    // We're moving the canonical instance of the node -> update owner accordingly
    node.ownerId = newParentId
  }
  const { childIndex: currentChildIndex } = getViewContext(oldParent, nodeId)
  // Remove node from old parent
  const childRef = oldParent.content.splice(currentChildIndex, 1)[0]
  // Add node to new parent
  addChildReference(state, node.id, newParentId, childIndex, childRef.expanded)
}

export function addChildReference(
  state: RootState['undoable']['present']['nodes'],
  childId: Doc['id'],
  parentId: ParentDoc['id'],
  atIndex: number,
  expanded: boolean = false,
) {
  const parent = getDoc(state, parentId)
  if (parent.content.some(it => it.nodeId === childId)) {
    // Node already linked in old parent, can't link a second time
    return
  }
  parent.content.splice(atIndex, 0, { nodeId: childId, expanded })
}
