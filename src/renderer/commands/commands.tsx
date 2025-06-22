import {NodeView} from '@/common/node-views'
import {Field, Id, Node, NodeGraphFlattened, Property, TextNode} from '@/common/nodes'
import {Selection} from '@/renderer/util/selection'
import {AppDispatch, RootState} from '@/renderer/redux/store'
import {nodeOpened} from '@/renderer/redux/ui/uiSlice'
import React from 'react'
import {FileQuestion, FullscreenIcon} from 'lucide-react'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {flatten} from '@/common/node-tree'
import {demoGraph} from '@/common/demoGraph'
import {nanoid} from '@reduxjs/toolkit'
import {saveWorkspaceCommand} from '@/renderer/persistence/save-workspace'
import {openWorkspaceCommand} from '@/renderer/persistence/open-workspace'
import {importFromTanaCommand} from '@/renderer/persistence/tana-import'
import {insertSubtreeAtCurrentNode} from '@/renderer/redux/nodes/insert-subtree-at-current-node'

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
    thunkCreator: (context: CommandContext) => createUndoTransaction((dispatch: AppDispatch) => {
      const nodeView = context.focus?.nodeView ?? { nodeId: context.openedNode! }
      if (!nodeView) {
        console.warn('Insert Demo Content command triggered without node in context')
        return
      }
      const flattenedDemoGraph = mapIds(flatten(demoGraph), id => nanoid())
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
      dispatch(insertSubtreeAtCurrentNode(nodeView, flattenedDemoGraph, root.id))
    }),
  },
  openWorkspaceCommand,
  saveWorkspaceCommand,
  importFromTanaCommand,
]

/**
 * Updates all IDs used in the given nodeGraph via `mapId`, keeping links etc. intact. Don't use this on subgraphs whose
 * nodes might be referenced from elsewhere, as those references won't be caught. Meant for assigning random IDs to
 * nodes in a
 */
export function mapIds(nodeGraph: NodeGraphFlattened, mapId: (id: string) => string): NodeGraphFlattened {
  const idMapping = new Map<Node['id'], Node['id']>()

  function replaceId<T extends Node['id']>(id: T): T {
    if (idMapping.has(id)) {
      return idMapping.get(id)! as T
    }
    const newId = mapId(id) as T
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
