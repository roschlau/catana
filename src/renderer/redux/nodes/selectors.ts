import {createSelector} from '@reduxjs/toolkit'
import {RootState} from '../store'

import {resolveNode} from './helpers'

/**
 * Returns an object containing the non-link node that the given nodeId points to. If the given node is already a
 * non-link node, it is returned directly as the `node` property. If the given node is a link node, then it will be
 * available in the `link` property, and the `node` property will be the node that the link points to.
 */
export const selectResolvedNode = createSelector(
  [
    (state: RootState) => state.nodes.present,
    (_: RootState, nodeId: string) => nodeId,
  ],
  (nodes, nodeId) => {
    return resolveNode(nodes, nodeId)
  },
)
