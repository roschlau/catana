import {NodeView, NodeViewWithParent, ParentNodeView} from '@/common/node-views'
import {Id, Node, NodeGraphFlattened, NodeOfType, Property, TextNode} from '@/common/nodes'
import {createSelector} from '@reduxjs/toolkit'
import {RootState} from '@/renderer/redux/store'

export type NodeWithContext<T extends Node> = {
  node: T,
  viewContext?: {
    parentView: ParentNodeView,
    parent: TextNode | Property,
    childIndex: number,
    isExpanded: boolean,
  },
}

export function getNode<T extends Node['type']>(
  state: NodeGraphFlattened,
  nodeId: Id<T>,
): NodeOfType<T> {
  const node = state[nodeId]
  if (!node) {
    throw new Error(`Node ${nodeId} not found`)
  }
  return node as NodeOfType<T>
}

export function getOptionalNode<T extends Node['type']>(
  state: NodeGraphFlattened,
  nodeId: Id<T>,
): NodeOfType<T> | undefined {
  const node = state[nodeId]
  if (!node) {
    return undefined
  }
  return node as NodeOfType<T>
}

export function selectResolvedNodeView<T extends Node>(nodeView: NodeViewWithParent<T>): (state: RootState) => Required<NodeWithContext<T>> {
  return (state: RootState) => _selectResolvedNodeView(state, nodeView) as Required<NodeWithContext<T>>
}

const _selectResolvedNodeView = createSelector([
  (state: RootState) => state.undoable.present.nodes,
  (_: RootState, nodeView: NodeViewWithParent<Node>) => nodeView,
], (nodes, nodeView) => resolveNodeView(nodes, nodeView))

export function resolveNodeView<T extends Node>(state: NodeGraphFlattened, nodeView: NodeViewWithParent<T>): Required<NodeWithContext<T>>
export function resolveNodeView<T extends Node>(state: NodeGraphFlattened, nodeView: NodeView<T>): NodeWithContext<T>
export function resolveNodeView<T extends Node>(
  state: NodeGraphFlattened,
  nodeView: NodeView<T>,
): NodeWithContext<T> {
  const node = getNode(state, nodeView.nodeId) as T
  const viewContext = nodeView.parent
    ? { ...getViewContext(getNode(state, nodeView.parent.nodeId), nodeView.nodeId), parentView: nodeView.parent }
    : undefined
  return { node, viewContext }
}

export function findBacklinks(state: NodeGraphFlattened, nodeId: Node['id']): TextNode['content'] {
  return Object.values(state)
    .flatMap((node) => {
      if (node!.type === 'field') {
        return []
      }
      return node!.content.filter(child => child.nodeId === nodeId)
    })
}

export function getViewContext(parent: TextNode | Property, childId: Node['id']) {
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
