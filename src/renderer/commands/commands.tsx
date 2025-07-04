import {FileQuestion, FullscreenIcon} from 'lucide-react'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {nodeOpened} from '@/renderer/redux/ui/uiSlice'
import {flatten} from '@/common/node-tree'
import {demoGraph} from '@/common/demoGraph'
import {nanoid} from '@reduxjs/toolkit'
import {insertTrees} from '@/renderer/redux/nodes/insert-content'
import {openWorkspaceCommand} from '@/renderer/persistence/open-workspace'
import {saveWorkspaceCommand} from '@/renderer/persistence/save-workspace'
import {importFromTanaCommand} from '@/renderer/persistence/tana-import'
import React from 'react'
import {AppCommand, CommandContext} from '@/renderer/commands/app-command'
import {mapIds} from '@/renderer/redux/nodes/mapIds'

export const commands: AppCommand[] = [
  {
    name: 'Zoom in on node',
    additionalSearchTerms: 'open focus',
    icon: <FullscreenIcon/>,
    shortcut: 'Alt →',
    canActivate: (context) => !!context.focus?.nodeView?.parent,
    thunkCreator: (context: CommandContext) => (dispatch: AppDispatch, _getState: () => AppState) => {
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
    thunkCreator: (context: CommandContext) => (dispatch: AppDispatch) => {
      const nodeView = context.focus?.nodeView ?? { nodeId: context.openedNode! }
      if (!nodeView) {
        console.warn('Insert Demo Content command triggered without node in context')
        return
      }
      const flattenedDemoGraph = mapIds(flatten(demoGraph).nodes, () => nanoid())
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
      dispatch(insertTrees(nodeView, [{ nodes: flattenedDemoGraph, rootId: root.id }]))
    },
  },
  openWorkspaceCommand,
  saveWorkspaceCommand,
  importFromTanaCommand,
]
