import {Id, Node, NodeGraphFlattened, TextNode} from '@/common/nodes'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {getNode, resolveNodeView} from '@/renderer/features/node-graph/helpers'
import {mapIds} from '@/renderer/features/node-graph/mapIds'
import {nanoid} from '@reduxjs/toolkit'
import {nodeTreeAdded} from '@/renderer/features/node-graph/nodesSlice'
import {focusRestoreRequested} from '@/renderer/features/ui/uiSlice'
import {NodeViewWithParent} from '@/common/node-views'

export const duplicateSubtree = (
  nodeView: NodeViewWithParent<TextNode>,
) => (dispatch: AppDispatch, getState: () => AppState) => {
  const { nodeId } = nodeView
  const state = getState()
  const node = getNode(state.undoable.present.nodes, nodeId)
  if (!node.ownerId) {
    throw Error(`Can't duplicate root node ${nodeId}`)
  }
  if (nodeView.parent.nodeId !== node.ownerId) {
    throw Error(`Can't duplicate linked node ${nodeId}`)
  }
  const { viewContext: { childIndex } } = resolveNodeView(state.undoable.present.nodes, { nodeId, parent: { nodeId: node.ownerId } })
  const subgraph = getSubgraph(nodeId, state.undoable.present.nodes)
  const newRootId = nanoid() as Id<'node'>
  const duplicateGraph = mapIds(subgraph, (id) => id === nodeId ? newRootId : nanoid())
  dispatch(nodeTreeAdded({ graph: duplicateGraph, root: newRootId, parent: node.ownerId, index: childIndex + 1 }))
  dispatch(focusRestoreRequested({ nodeView: { nodeId: newRootId, parent: nodeView.parent }, selection: { start: 0 } }))
}

const getSubgraph = (nodeId: Id<'node'>, state: NodeGraphFlattened): NodeGraphFlattened => {
  const subgraph: NodeGraphFlattened = {}
  const knownNodes = new Set<Node['id']>()
  const toProcess: Node['id'][] = [nodeId]
  while (toProcess.length > 0) {
    const nextId = toProcess.shift()!
    const node = getNode(state, nextId)
    if (knownNodes.has(node.id)) {
      // Node has already been recorded as part of the subgraph, don't need to add it again
      continue
    }
    if ((!node.ownerId || !knownNodes.has(node.ownerId)) && nextId !== nodeId) {
      // Owner of this node is not (yet) known to be part of the subgraph.
      // That means we followed a link to it, and we shouldn't add it.
      // We'll encounter it again if it actually belongs to the subgraph.
      continue
    }
    knownNodes.add(node.id)
    subgraph[node.id] = node
    toProcess.push(...getLinkedNodeIds(node))
  }
  return subgraph
}

const getLinkedNodeIds = (node: Node): Node['id'][] => {
  switch (node.type) {
    case 'node':
    case 'property':
      return node.content.map(it => it.nodeId)
    case 'field':
      return []
  }
}
