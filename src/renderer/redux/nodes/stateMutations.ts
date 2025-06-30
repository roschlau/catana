import {NodeViewWithParent} from '@/common/node-views'
import {findBacklinks, getNode, getOptionalNode, getViewContext, resolveNodeView} from './helpers'
import {AppState} from '@/renderer/redux/store'
import {Id, Node, ParentNode} from '@/common/nodes'

/**
 * Deletes a node and points all parents linking to it to a new node. Specifically intended for the use case of
 * finalizing the merge of two nodes.
 */
export function deleteNodeAfterMerge(
  state: AppState['undoable']['present']['nodes'],
  nodeView: NodeViewWithParent<Node>,
  mergedNode: Id<'node'>,
) {
  // Remove from parent's children
  const { node, viewContext } = resolveNodeView(state, nodeView)
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
 * Deletes a node and all its owned children recursively.
 *
 * This operation will leave behind dangling references when nodes outside the deleted tree link to a node inside it.
 *
 * This operation assumes that all nodes are correctly listed in the `content` list of their owner node. Nodes that
 * don't appear in the `content` list of their owner node will not be deleted correctly.
 */
export function deleteNodeTree(
  state: AppState['undoable']['present']['nodes'],
  root: Node['id'],
) {
  const node = getNode(state, root)
  if (node.type === 'field') {
    delete state[root]
    return
  }
  // Delete all owned children first
  node.content.forEach(child => {
    const childNode = getOptionalNode(state, child.nodeId)
    if (childNode && childNode.ownerId === root) {
      deleteNodeTree(state, child.nodeId)
    }
  })
  delete state[root]
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
  state: AppState['undoable']['present']['nodes'],
  nodeId: Node['id'],
  oldParentId: ParentNode['id'],
  newParentId: ParentNode['id'],
  childIndex: number,
) {
  const node = getNode(state, nodeId)
  const oldParent = getNode(state, oldParentId)
  if (oldParent.id === node.ownerId && oldParent.id !== newParentId) {
    // We're moving the canonical instance of the node -> update owner accordingly
    node.ownerId = newParentId
    node.history.lastModifiedTime = new Date().getTime()
  }
  const { childIndex: currentChildIndex } = getViewContext(oldParent, nodeId)
  // Remove node from old parent
  const childRef = oldParent.content.splice(currentChildIndex, 1)[0]
  // Add node to new parent
  addChildReference(state, node.id, newParentId, childIndex, childRef.expanded)
}

export function addChildReference(
  state: AppState['undoable']['present']['nodes'],
  childId: Node['id'],
  parentId: ParentNode['id'],
  atIndex: number,
  expanded: boolean = false,
) {
  const parent = getNode(state, parentId)
  if (parent.content.some(it => it.nodeId === childId)) {
    // Node already linked in parent, can't link a second time
    return
  }
  parent.content.splice(atIndex, 0, { nodeId: childId, expanded })
}

export function removeChildReference(
  state: AppState['undoable']['present']['nodes'],
  childId: Node['id'],
  parentId: ParentNode['id'],
) {
  const parent = getNode(state, parentId)
  parent.content = parent.content.filter(it => it.nodeId !== childId)
}
