import {NodeView} from '@/common/node-views'
import {Id, TextNode} from '@/common/nodes'
import {Selection} from '@/renderer/util/selection'
import {AppDispatch, AppState} from '@/renderer/redux/store'
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
  /** Additional terms that users might search for that are not already part of the name of this command.
   * Doesn't actually do anything yet, to be implemented. */
  additionalSearchTerms?: string,
  shortcut?: (string | React.ReactNode)[],
  icon?: React.ReactNode,
  canActivate: (context: CommandContext) => boolean,
  thunkCreator: (context: CommandContext) => (dispatch: AppDispatch, getState: () => AppState) => void,
}
