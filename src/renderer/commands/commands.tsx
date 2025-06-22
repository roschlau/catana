import {NodeView, NodeViewWithParent} from '@/common/node-views'
import {Field, Id, Node, NodeGraphFlattened, ParentNode, Property, TextNode} from '@/common/nodes'
import {Selection} from '@/renderer/redux/nodes/thunks'
import {AppDispatch, RootState} from '@/renderer/redux/store'
import {nodeOpened} from '@/renderer/redux/ui/uiSlice'
import React from 'react'
import {FileQuestion, FullscreenIcon} from 'lucide-react'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {flatten} from '@/common/node-tree'
import {demoGraph} from '@/common/demoGraph'
import {nanoid} from '@reduxjs/toolkit'
import {nodeExpandedChanged, nodeTreeAdded, nodeTreeDeleted} from '@/renderer/redux/nodes/nodesSlice'
import {resolveNodeRef} from '@/renderer/redux/nodes/helpers'

export type CommandContext = {
  openedNode?: Id<'node'>
  focus?: {
    nodeView: NodeView<TextNode>,
    selection?: Selection,
  }
}

export type AppCommand = {
  name: string,
  additionalSearchTerms?: string,
  shortcut?: string,
  icon?: React.ReactNode,
  canActivate: (context: CommandContext) => boolean,
  thunkCreator: (context: CommandContext) => (dispatch: AppDispatch, getState: () => RootState) => void,
}

export const commands: AppCommand[] = [
  {
    name: 'Zoom in on node',
    additionalSearchTerms: 'open focus',
    icon: <FullscreenIcon/>,
    shortcut: 'Alt →',
    canActivate: (context) => !!context.focus?.nodeView?.parent,
    thunkCreator: (context: CommandContext) => (dispatch: AppDispatch, _getState: () => RootState) => {
      if (!context.focus) {
        console.warn('Zoom command triggered without node in context')
        return
      }
      dispatch(nodeOpened({ nodeId: context.focus.nodeView.nodeId }))
    },
  },
  {
    name: 'Insert Demo Content',
    icon: <FileQuestion/>,
    canActivate: (context) => !!context.focus || !!context.openedNode,
    thunkCreator: (context: CommandContext) => createUndoTransaction((
      dispatch: AppDispatch,
      getState: () => RootState,
    ) => {
      const nodeView = context.focus?.nodeView ?? { nodeId: context.openedNode! }
      if (!nodeView) {
        console.warn('Insert Demo Content command triggered without node in context')
        return
      }
      const flattenedDemoGraph = randomizeIds(flatten(demoGraph))
      const roots = Object.values(flattenedDemoGraph).filter(node => !node!.ownerId)
      if (roots.length !== 1) {
        console.warn('Demo graph contains the following roots: ', roots.map(node => node!.id).join(','))
        throw new Error('Demo graph must contain exactly one root node')
      }
      const root = roots[0]!
      if (root.type !== 'node') {
        console.warn(`Demo graph root node ${root.id} was ${root.type}`)
        throw new Error('Demo graph root node must be a text node')
      }
      const { node, viewContext } = resolveNodeRef(getState().undoable.present.nodes, nodeView)
      let parentNode: ParentNode
      if (node.title === '' && node.content.length === 0 && viewContext) {
        // If the focused node is empty, replace it with the inserted content's root node
        parentNode = viewContext.parent
        dispatch(nodeTreeDeleted({ nodeId: node.id }))
      } else {
        parentNode = node
        if (nodeView.parent) {
          // Make sure the target node is expanded in the current view
          const nodeViewWithParent = nodeView as NodeViewWithParent<TextNode>
          dispatch(nodeExpandedChanged({ nodeView: nodeViewWithParent, expanded: true }))
        }
      }
      dispatch(nodeTreeAdded({ graph: flattenedDemoGraph, root: root.id, parent: parentNode.id }))
    }),
  },
]

function randomizeIds(nodeGraph: NodeGraphFlattened): NodeGraphFlattened {
  const idMapping = new Map<Node['id'], Node['id']>()

  function replaceId<T extends Node['id']>(id: T): T {
    if (idMapping.has(id)) {
      return idMapping.get(id)! as T
    }
    const newId = nanoid() as T
    idMapping.set(id, newId)
    return newId as T
  }

  const newGraph: NodeGraphFlattened = {}
  Object.values(nodeGraph).forEach(node => {
    if (!node) return
    let newNode: Node
    switch (node.type) {
      case 'node': {
        const newId = replaceId(node.id)
        newNode = {
          ...node,
          id: newId,
          content: node.content.map(it => ({ ...it, nodeId: replaceId(it.nodeId) })),
          ownerId: node.ownerId ? replaceId(node.ownerId) : null,
        } satisfies TextNode
        break
      }
      case 'field': {
        const newId = replaceId(node.id)
        newNode = {
          ...node,
          id: newId,
          ownerId: replaceId(node.ownerId),
        } satisfies Field
        break
      }
      case 'property': {
        const newId = replaceId(node.id)
        newNode = {
          ...node,
          id: newId,
          content: node.content.map(it => ({ ...it, nodeId: replaceId(it.nodeId) })),
          ownerId: replaceId(node.ownerId),
          fieldId: replaceId(node.fieldId),
        } satisfies Property
        break
      }
    }
    newGraph[newNode.id] = newNode
  })
  return newGraph
}
