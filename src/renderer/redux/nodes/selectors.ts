import {createSelector} from '@reduxjs/toolkit'
import {RootState} from '@/renderer/redux/store'
import {Doc, ParentDoc} from '@/common/nodeGraphModel'
import {getDoc} from '@/renderer/redux/nodes/helpers'

/**
 * Returns a flat list of all nodes in the owner lineage of the passed node, starting with the furthest ancestor and
 * ending with the direct owner of the node.
 * Given a node graph like this:
 * ```
 * A
 * ├──┐
 * B  C
 *    │
 *    D
 *
 * selectAncestry(D) === [A, C]
 * selectAncestry(B) === [A]
 * selectAncestry(C) === [A]
 * selectAncestry(A) === []
 * ```
 *
 */
export const selectAncestry = createSelector([
  (_: RootState, node: Doc) => node,
  (state: RootState) => state.undoable.present.nodes,
], (node, nodes) => {
  const path = [] as ParentDoc[]
  let next: ParentDoc['id'] | null = node.ownerId
  while (next) {
    const nextNode = getDoc(nodes, next)
    path.unshift(nextNode)
    next = nextNode.ownerId
  }
  return path
})

export const selectDocs = createSelector([
  (_: RootState, nodeIds: Doc['id'][]) => nodeIds,
  (state: RootState) => state.undoable.present.nodes,
], (nodeIds, nodes) => {
  return nodeIds.map(id => getDoc(nodes, id))
})
