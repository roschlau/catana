import {encloseRange} from '@/common/markdown-utils'
import {Selection} from '@/renderer/util/selection'
import {AppDispatch} from '@/renderer/redux/store'
import {TextNode} from '@/common/nodes'
import {NodeView} from '@/common/node-views'
import {titleUpdated} from '@/renderer/features/node-graph/nodesSlice'
import {focusRestoreRequested} from '@/renderer/features/ui/uiSlice'
import {KeyboardEvent} from 'react'
import {modKey} from '@/renderer/util/keyboard'

type EditorAction =(content: string, selection: Selection) => EditResult

export type EditResult = {
  newContent: string,
  newSelection: Selection,
}

const getShortcut = (event: KeyboardEvent): string => {
  let shortcut = ''
  if (modKey(event)) {
    shortcut += 'mod-'
  }
  if (event.altKey) {
    shortcut += 'alt-'
  }
  shortcut += event.key
  return shortcut
}

export const getEditorActionThunk = (
  event: KeyboardEvent,
  node: TextNode,
  nodeView: NodeView<TextNode>,
  selection: Selection,
) => {
  const shortcut = getShortcut(event)
  const action = editorShortcuts[shortcut]
  if (!action) {
    return null
  }
  console.debug(`Editor action found for shortcut ${shortcut}`)
  return (dispatch: AppDispatch) => {
    const { newContent, newSelection } = action(node.title, selection)
    dispatch(titleUpdated({ nodeId: node.id, title: newContent }))
    dispatch(focusRestoreRequested({
      nodeView,
      selection: newSelection,
    }))
  }
}

const encloseRangeAction = (prefix: string, suffix: string = prefix): EditorAction => (content, selection) => {
  const { result, mappedRange } = encloseRange(content, selection, 'enclose', prefix, suffix)
  return {
    newContent: result,
    newSelection: mappedRange,
  }
}

const toggleRangeAction = (prefix: string, suffix: string = prefix): EditorAction => (content, selection) => {
  const { result, mappedRange } = encloseRange(content, selection, 'toggle', prefix, suffix)
  return {
    newContent: result,
    newSelection: mappedRange,
  }
}

export const editorShortcuts: Record<string, EditorAction | undefined> = {
  'mod-b': toggleRangeAction('**'),
  '*': encloseRangeAction('*'),
  'mod-i': toggleRangeAction('*'),
  '`': encloseRangeAction('`'),
  'mod-e': toggleRangeAction('`'),
  '(': encloseRangeAction('(', ')'),
  '[': encloseRangeAction('[', ']'),
  '{': encloseRangeAction('{', '}'),
}
