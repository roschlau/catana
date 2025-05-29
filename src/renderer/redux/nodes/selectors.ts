import {createSelector} from '@reduxjs/toolkit'
import {RootState} from '@/renderer/redux/store'
import {Id, Node} from '@/common/nodeGraphModel'

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
  (_: RootState, node: Node) => node,
  (state: RootState) => state.undoable.present.nodes,
], (node, nodes) => {
  const path = [] as Node[]
  let next: Id<'node'> | null = node.ownerId
  while (next) {
    const nextNode: Node = nodes[next]!
    path.unshift(nextNode)
    next = nextNode.ownerId
  }
  return path
})
