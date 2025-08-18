import {markRange} from '@/common/markdown-utils'
import {Selection} from '@/renderer/util/selection'
import {AppDispatch} from '@/renderer/redux/store'
import {TextNode} from '@/common/nodes'
import {NodeView} from '@/common/node-views'
import {titleUpdated} from '@/renderer/features/node-graph/nodes-slice'
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

const removeClosingChar: EditorAction = (content, selection) => {
  if (selection.start !== selection.end) {
    return null
  }
  if (selection.start === 0) {
    return null
  }
  const toDelete = content[selection.start - 1]
  const matchingNext = charRangePairs.get(toDelete)
  if (!matchingNext) {
    return null
  }
  const actualNext = content[selection.start]
  if (matchingNext !== actualNext) {
    return null
  }
  return {
    newContent: content.slice(0, selection.start - 1) + content.slice(selection.start + 1),
    newSelection: { start: selection.start - 1, end: selection.start - 1 },
  }
}

export const charRangePairs = new Map<string, string>([
  ['*', '*'],
  ['~', '~'],
  ['`', '`'],
  ['(', ')'],
  ['[', ']'],
  ['{', '}'],
])

export const editorShortcuts: Record<string, EditorAction | undefined> = {
  'mod-b': range('toggle', '**'),
  'mod-i': range('toggle', '*'),
  'mod-e': range('toggle', '`'),
  'mod-S': range('toggle', '~~'),
  'Backspace': removeClosingChar,
  // Auto-generate range and skipOver shortcuts from charRangePairs
  ...charRangePairs.entries()
    .reduce((prev, [prefix, suffix]) =>
        prefix === suffix
          ? {
            ...prev,
            [prefix]: range('enclose', prefix),
          }
          : {
            ...prev,
            [prefix]: range('enclose', prefix, suffix),
            [suffix]: skipOver(suffix),
          },
      {}),
}
