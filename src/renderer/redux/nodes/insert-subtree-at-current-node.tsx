import {NodeView, NodeViewWithParent} from '@/common/node-views'
import {Id, NodeGraphFlattened, ParentNode, TextNode} from '@/common/nodes'
import {AppDispatch, RootState} from '@/renderer/redux/store'
import {resolveNodeView} from '@/renderer/redux/nodes/helpers'
import {nodeExpandedChanged, nodeTreeAdded, nodeTreeDeleted} from '@/renderer/redux/nodes/nodesSlice'

export const insertSubtreeAtCurrentNode = (
  nodeView: NodeView<TextNode>,
  graph: NodeGraphFlattened,
  rootId: Id<'node'>,
) => (
  dispatch: AppDispatch,
  getState: () => RootState,
) => {
  const { node, viewContext } = resolveNodeView(getState().undoable.present.nodes, nodeView)
  let parentNode: ParentNode
  let index: number | undefined = undefined
  if (node.title === '' && node.content.length === 0 && viewContext) {
    // If the focused node is empty, replace it with the inserted content's root node
    parentNode = viewContext.parent
    dispatch(nodeTreeDeleted({ nodeId: node.id }))
    index = viewContext.childIndex
  } else {
    parentNode = node
    if (nodeView.parent) {
      // Make sure the target node is expanded in the current view
      const nodeViewWithParent = nodeView as NodeViewWithParent<TextNode>
      dispatch(nodeExpandedChanged({ nodeView: nodeViewWithParent, expanded: true }))
    }
  }
  dispatch(nodeTreeAdded({ graph: graph, root: rootId, parent: parentNode.id, index }))
}
