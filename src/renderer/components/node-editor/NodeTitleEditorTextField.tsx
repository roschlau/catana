import TextareaAutosize from 'react-textarea-autosize'
import {checkboxUpdated, titleUpdated} from '@/renderer/features/node-graph/nodesSlice'
import React, {ClipboardEvent, KeyboardEvent, Ref, useImperativeHandle, useRef} from 'react'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {Selection} from '@/renderer/util/selection'
import {Checkbox} from '@/renderer/components/ui/checkbox'
import classNames from 'classnames'
import {CheckboxState, cycleCheckboxState} from '@/common/checkboxes'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {TextNode} from '@/common/nodes'
import {NodeView} from '@/common/node-views'
import {setCommandFocus} from '@/renderer/features/ui/uiSlice'
import {getNode} from '@/renderer/features/node-graph/helpers'
import {modKey} from '@/renderer/util/keyboard'
import {insertNodeLinks, insertTrees} from '@/renderer/features/node-graph/insert-content'
import {copyNode, readClipboard} from '@/common/conversion/clipboard'
import {flatten} from '@/common/node-tree'

export interface NodeTitleEditorTextFieldRef {
  focus: (selection?: Selection) => void
}

/**
 * Displays a text area for the user to edit the title of a node.
 * Handles dispatching actions for title editing itself, any other input is passed to the parent via `keyDown`.
 */
export function NodeTitleEditorTextField({
  nodeView, onKeyDown, ref,
}: {
  nodeView: NodeView<TextNode>
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void,
  ref?: Ref<NodeTitleEditorTextFieldRef>,
}) {
  useImperativeHandle(ref, () => ({
    focus: (selection) => {
      textAreaRef.current?.focus()
      if (selection) {
        textAreaRef.current?.setSelectionRange(selection.start, selection.end)
      }
    },
  }))
  const dispatch = useAppDispatch()
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const node = useAppSelector(state => getNode(state.undoable.present.nodes, nodeView.nodeId))

  const checkboxChecked = node.checkbox
  const setCheckbox = (state: CheckboxState | null) => {
    dispatch(checkboxUpdated({
      nodeId: node.id,
      state: state,
    }))
  }

  const _keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (['z', 'Z'].includes(e.key) && modKey(e)) {
      // Undo/Redo is handled globally, so prevent the browser's default behavior from interfering
      e.preventDefault()
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
        nodeView,
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
  }

  const onCopy = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.currentTarget.selectionStart !== e.currentTarget.selectionEnd) {
      // Let the default behavior do its thing to copy just a selection of the node's title
      return
    }
    e.preventDefault()
    copyNode(node, e.clipboardData)
  }

  const onPaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const { nodeIds, nodeTrees } = readClipboard(e.clipboardData)
    if (nodeIds) {
      e.preventDefault()
      try {
        dispatch(insertNodeLinks(nodeView, nodeIds))
        return
      } catch {
        console.warn(`Failed to insert node links from clipboard: ${nodeIds.join(', ')}. Falling back to plain content.`)
      }
    }
    if (nodeTrees && nodeTrees.length > 0) {
      e.preventDefault()
      dispatch(insertTrees(nodeView, nodeTrees.map(nodeTree => flatten(nodeTree))))
    }
  }

  const textareaClasses = classNames(
    'grow bg-none border-none resize-none text-foreground/80 focus:text-foreground outline-none',
    { 'line-through text-muted-foreground': checkboxChecked === true },
  )

  return (
    <div className={'w-full flex flex-row items-baseline gap-2'}>
      {checkboxChecked !== undefined && (
        <Checkbox
          className={'translate-y-0.5'}
          checked={checkboxChecked}
          onCheckedChange={setCheckbox}
        />
      )}
      <TextareaAutosize
        ref={textAreaRef}
        className={textareaClasses}
        value={node.title}
        placeholder={'Empty'}
        onChange={e => dispatch(titleUpdated({ nodeId: node.id, title: e.target.value }))}
        onKeyDown={_keyDown}
        onCopy={onCopy}
        onPaste={onPaste}
      />
    </div>
  )
}
