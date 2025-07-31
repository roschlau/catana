import {NodeView} from '@/common/node-views'
import {TextNode} from '@/common/nodes'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {nodeExpandedChanged} from '@/renderer/features/node-graph/nodesSlice'
import {getNode} from '@/renderer/features/node-graph/helpers'

export const expandAllChildren = (
  nodeView: NodeView<TextNode>,
) => createUndoTransaction((dispatch, getState) => {
  const node = getNode(getState().undoable.present.nodes, nodeView.nodeId)
  const shouldExpand = node.content.every(nodeRef => !nodeRef.expanded)
  node.content.forEach(nodeRef => {
    dispatch(nodeExpandedChanged({
      nodeView: { nodeId: nodeRef.nodeId, parent: nodeView },
      expanded: shouldExpand,
    }))
  })
})
