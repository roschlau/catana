import {Node, ParentNode} from '@/common/nodes'
import {Brand} from '@ark/util/'

/**
 * A node view that definitely has a parent
 */
export type NodeViewWithParent<T extends Node> = Required<NodeView<T>>

/** Identifies a node being viewed at a specific point in the Node graph. */
export interface NodeView<T extends Node> {
  nodeId: T['id'],
  parent?: NodeView<ParentNode>,
}

export type SerializedNodeView = Brand<string, 'nodeView'>
export type SerializedNodeViewWithParent = Brand<`${string}/${string}`, 'nodeView'>

export function serialize(nodeView: NodeViewWithParent<Node>): SerializedNodeViewWithParent
export function serialize(nodeView: NodeView<Node>): SerializedNodeView
export function serialize(nodeView: NodeView<Node>): SerializedNodeView {
  let result = nodeView.nodeId as string
  let next: NodeView<Node> | undefined = nodeView.parent
  while (next !== undefined) {
    result = `${next.nodeId}/${result}`
    next = next.parent
  }
  return result as SerializedNodeView
}

export function deserialize<T extends Node>(input: SerializedNodeViewWithParent): NodeViewWithParent<T>
export function deserialize<T extends Node>(input: SerializedNodeView): NodeView<T>
export function deserialize<T extends Node>(input: SerializedNodeView): NodeView<T> {
  let nodeView: NodeView<T> | undefined = undefined
  const nodePath = input.split('/')
  if (nodePath.length === 0) {
    throw Error(`Invalid node view: '${input}'`)
  }
  for (const nodeId of nodePath) {
    nodeView = {
      nodeId: nodeId as Node['id'],
      parent: nodeView as NodeView<ParentNode> | undefined
    }
  }
  return nodeView!
}

/** Checks whether the passed NodeView contains any of the nodes within it more than once. */
export function isRecursive(nodeView: NodeView<Node>): boolean {
  const seenIds = new Set<Node['id']>()
  let next: NodeView<Node> | undefined = nodeView
  while (next !== undefined) {
    if (seenIds.has(next.nodeId)) {
      return true
    }
    seenIds.add(next.nodeId)
    next = next.parent
  }
  return false
}

/** Checks recursively if the passed NodeViews correspond to the same view. */
export function isSameView(a: NodeView<Node> | undefined, b: NodeView<Node> | undefined): boolean {
  if (a === undefined || b === undefined) {
    return a === undefined && b === undefined
  }
  return a.nodeId === b.nodeId && isSameView(a.parent, b.parent)
}
