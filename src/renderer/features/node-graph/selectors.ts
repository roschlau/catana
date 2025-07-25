import {createSelector} from '@reduxjs/toolkit'
import {AppState} from '@/renderer/redux/store'
import {getNode} from '@/renderer/features/node-graph/helpers'
import {Node, ParentNode} from '@/common/nodes'

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
  (_: AppState, node: Node) => node,
  (state: AppState) => state.undoable.present.nodes,
], (node, nodes) => {
  const path = [] as ParentNode[]
  let next: ParentNode['id'] | null = node.ownerId
  while (next) {
    const nextNode = getNode(nodes, next)
    path.unshift(nextNode)
    next = nextNode.ownerId
  }
  return path
})
