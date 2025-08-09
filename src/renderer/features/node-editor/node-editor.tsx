import TextareaAutosize from 'react-textarea-autosize'
import {checkboxUpdated, titleUpdated} from '@/renderer/features/node-graph/nodesSlice'
import React, {
  ClipboardEvent,
  KeyboardEvent,
  MouseEvent,
  Ref,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {Selection} from '@/renderer/util/selection'
import {Checkbox} from '@/renderer/components/ui/checkbox'
import {CheckboxState, cycleCheckboxState, inProgressDuration} from '@/common/checkboxes'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {TextNode} from '@/common/nodes'
import {deserialize, SerializedNodeView} from '@/common/node-views'
import {focusRestoreRequested, setCommandFocus} from '@/renderer/features/ui/uiSlice'
import {getNode} from '@/renderer/features/node-graph/helpers'
import {modKey} from '@/renderer/util/keyboard'
import {insertNodeLinks, insertTrees} from '@/renderer/features/node-graph/insert-content'
import {copyNode, readClipboard} from '@/common/conversion/clipboard'
import {flatten} from '@/common/node-tree'
import {cn} from '@/renderer/util/tailwind'
import {isLink, markRange} from '@/common/markdown-utils'
import {TooltipSimple} from '@/renderer/components/ui/tooltip'
import {getEditorActionThunk} from '@/renderer/features/node-editor/editor-actions'
import {expandSelection} from '@/renderer/util/expand-selection'
import {displayWarning} from '@/renderer/features/ui/toasts'
import {CheckedState} from '@radix-ui/react-checkbox'
import {DurationFormat, formatDuration} from '@/common/time'
import {RenderedNodeTitle} from '@/renderer/features/node-editor/rendered-node-title'

export interface NodeTitleEditorTextFieldRef {
  focus: (selection?: Selection) => void
}

/**
 * Displays a text area for the user to edit the title of a node.
 * Handles dispatching actions for title editing itself, any other input is passed to the parent via `keyDown`.
 */
export const NodeEditor = React.memo(function NodeEditor({
  nodeView, onKeyDown, ref,
}: {
  nodeView: SerializedNodeView,
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void,
  ref?: Ref<NodeTitleEditorTextFieldRef>,
}) {
  const nv = useMemo(() => deserialize<TextNode>(nodeView), [nodeView])
  useImperativeHandle(ref, () => ({
    focus: (selection) => {
      setIsEditing(true)
      if (selection) {
        setSelectionRange(selection)
      }
    },
  }))
  const dispatch = useAppDispatch()
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const node = useAppSelector(state => getNode(state.undoable.present.nodes, nv.nodeId))

  const [isEditing, setIsEditing] = React.useState(false)
  const [selectionRange, setSelectionRange] = React.useState(null as null | Selection)
  useLayoutEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus()
      if (selectionRange !== null) {
        textAreaRef.current.setSelectionRange(selectionRange.start, selectionRange.end)
        setSelectionRange(null)
      }
    }
  }, [selectionRange, isEditing])

  const handleDisplayClick = useCallback((e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) return
    const offset = window.getSelection()?.focusOffset ?? 0
    setSelectionRange({ start: offset, end: offset })
    setIsEditing(true)
  }, [setSelectionRange, setIsEditing])

  const checkboxChecked = node.checkbox
  const setCheckbox = useCallback((state: CheckboxState | null) => {
    dispatch(checkboxUpdated({
      nodeId: node.id,
      state: state,
    }))
  }, [dispatch, node.id])

  const _keyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const currentSelection: Selection = {
      start: e.currentTarget.selectionStart,
      end: e.currentTarget.selectionEnd,
    }
    if (['z', 'Z'].includes(e.key) && modKey(e)) {
      // Undo/Redo is handled globally, so prevent the browser's default behavior from interfering
      e.preventDefault()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsEditing(false)
      return
    }
    const editorAction = getEditorActionThunk(e, node, nv, currentSelection)
    if (editorAction) {
      e.preventDefault()
      dispatch(editorAction)
      return
    }
    if (e.key === 'w' && modKey(e)) {
      e.preventDefault()
      setSelectionRange(expandSelection(node.title, currentSelection))
      return
    }
    if (e.key === 'Enter' && modKey(e)) {
      e.preventDefault()
      const newState = cycleCheckboxState(node.checkbox)
      setCheckbox(newState)
      return
    }
    if (e.key === 'k' && modKey(e)) {
      // User triggered the command prompt while focused on this node, so set this node as the command focus
      dispatch(setCommandFocus({
        nodeView: nv,
        selection: { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd },
      }))
      // Not preventing the default here so that the global handler can open the prompt normally
      return
    }
    if (e.key === ' ' && checkboxChecked === undefined
      && node.title.startsWith('[]') && e.currentTarget.selectionStart === 2 && e.currentTarget.selectionStart === 2
    ) {
      e.preventDefault()
      // Add the typed space normally first. This makes sure you can Undo to still get a node beginning with the
      // literal text `[] ` if you need that for some reason.
      dispatch(titleUpdated({ nodeId: node.id, title: '[] ' + node.title.slice(2) }))
      dispatch(createUndoTransaction((dispatch) => {
        dispatch(checkboxUpdated({
          nodeId: node.id,
          state: false,
        }))
        dispatch(titleUpdated({ nodeId: node.id, title: node.title.slice(2) }))
      }))
      return
    }
    onKeyDown?.(e)
  }, [node, nv, checkboxChecked, onKeyDown, dispatch, setCheckbox])

  const onCopy = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.currentTarget.selectionStart !== e.currentTarget.selectionEnd) {
      // Let the default behavior do its thing to copy just a selection of the node's title
      return
    }
    e.preventDefault()
    copyNode(node, e.clipboardData)
  }

  const onPaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const { nodeIds, nodeTrees, plainText } = readClipboard(e.clipboardData)
    if (nodeIds) {
      e.preventDefault()
      try {
        dispatch(insertNodeLinks(nv, nodeIds))
        return
      } catch {
        displayWarning(`Failed to insert node links from clipboard. Falling back to plain content.`, { logData: nodeIds })
      }
    }
    if (nodeTrees && nodeTrees.length > 0) {
      e.preventDefault()
      dispatch(insertTrees(nv, nodeTrees.map(nodeTree => flatten(nodeTree))))
      return
    }
    const selection = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd }
    if (selection.start !== selection.end && isLink(plainText)) {
      e.preventDefault()
      const suffix = '](' + plainText + ')'
      const { result, mappedRange } = markRange(node.title, selection, 'enclose', '[', suffix)
      dispatch(titleUpdated({ nodeId: node.id, title: result }))
      dispatch(focusRestoreRequested({ nodeView: nv, selection: { start: mappedRange.end + suffix.length } }))
      return
    }
  }

  const sharedClasses = cn('grow py-0.5')
  const textareaClasses = cn(
    sharedClasses,
    'bg-none border-none resize-none focus:text-foreground outline-none',
  )
  const divClasses = cn(
    sharedClasses,
    'bg-none border-none resize-none cursor-text',
    { 'line-through text-muted-foreground': checkboxChecked === true },
    { 'text-muted-foreground': !node.title },
  )

  return (
    <div className={'w-full flex flex-row items-baseline gap-2'}>
      {checkboxChecked !== undefined && <NodeCheckbox
        history={node.history.checkbox}
        checked={checkboxChecked}
        onCheckedChange={setCheckbox}
      />}
      {isEditing && (
        <TextareaAutosize
          ref={textAreaRef}
          className={textareaClasses}
          value={node.title}
          placeholder={'Empty'}
          onChange={e => dispatch(titleUpdated({ nodeId: node.id, title: e.target.value }))}
          onKeyDown={_keyDown}
          onCopy={onCopy}
          onPaste={onPaste}
          onBlur={() => setIsEditing(false)}
        />
      ) || (
        <RenderedNodeTitle
          title={node.title}
          className={divClasses}
          onClick={handleDisplayClick}
        />
      )}
    </div>
  )
})

export function NodeCheckbox({
  history,
  checked,
  onCheckedChange,
}: {
  history: TextNode['history']['checkbox'],
  checked: CheckedState,
  onCheckedChange: (state: CheckedState) => void,
}) {
  const duration = inProgressDuration(history ?? [])
  const tooltip = duration ? formatDuration(duration, DurationFormat.letters) : 'No history'
  return (
    <TooltipSimple content={tooltip}>
      <Checkbox
        className={'translate-y-0.5'}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </TooltipSimple>
  )
}
