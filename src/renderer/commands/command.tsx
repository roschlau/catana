import {NodeView} from '@/common/node-views'
import {Id, TextNode} from '@/common/nodes'
import {Selection} from '@/renderer/util/selection'
import {AppDispatch, RootState} from '@/renderer/redux/store'
import React from 'react'

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
