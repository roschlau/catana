import {markRange} from '@/common/markdown-utils'
import {Selection} from '@/renderer/util/selection'
import {AppDispatch} from '@/renderer/redux/store'
import {TextNode} from '@/common/nodes'
import {NodeView} from '@/common/node-views'
import {titleUpdated} from '@/renderer/features/node-graph/nodesSlice'
import {focusRestoreRequested} from '@/renderer/features/ui/uiSlice'
import {KeyboardEvent} from 'react'
import {modKey} from '@/renderer/util/keyboard'

type EditorAction = (content: string, selection: Selection) => EditResult | null

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
  const actionResult = editorShortcuts[shortcut]?.(node.title, selection)
  if (!actionResult) {
    return null
  }
  const { newContent, newSelection } = actionResult
  console.debug(`Editor action found for shortcut ${shortcut}`)
  return (dispatch: AppDispatch) => {
    if (newContent !== node.title) {
      dispatch(titleUpdated({ nodeId: node.id, title: newContent }))
    }
    dispatch(focusRestoreRequested({
      nodeView,
      selection: newSelection,
    }))
  }
}

const range = (
  mode: 'toggle' | 'enclose',
  prefix: string,
  suffix: string = prefix,
): EditorAction => (content, selection) => {
  const { result, mappedRange } = markRange(content, selection, mode, prefix, suffix)
  return {
    newContent: result,
    newSelection: mappedRange,
  }
}

const skipOver = (char: string): EditorAction => (content, selection) => {
  if (selection.start !== selection.end || content[selection.start] !== char) {
    return null
  }
  return {
    newContent: content,
    newSelection: { start: selection.start + 1, end: selection.end + 1 },
  }
}

export const editorShortcuts: Record<string, EditorAction | undefined> = {
  'mod-b': range('toggle', '**'),
  '*': range('enclose', '*'),
  'mod-i': range('toggle', '*'),
  '~': range('enclose', '~'),
  '`': range('enclose', '`'),
  'mod-e': range('toggle', '`'),
  '(': range('enclose', '(', ')'),
  '[': range('enclose', '[', ']'),
  '{': range('enclose', '{', '}'),
  ')': skipOver(')'),
  ']': skipOver(']'),
  '}': skipOver('}'),
}
