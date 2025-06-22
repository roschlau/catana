import TextareaAutosize from 'react-textarea-autosize'
import {checkboxUpdated, titleUpdated} from '@/renderer/redux/nodes/nodesSlice'
import React, {KeyboardEvent, Ref, useImperativeHandle, useRef} from 'react'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {Selection} from '@/renderer/util/selection'
import {Checkbox} from '@/renderer/components/ui/checkbox'
import classNames from 'classnames'
import {cycleCheckboxState} from '@/common/checkboxes'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {TextNode} from '@/common/nodes'
import {NodeView} from '@/common/node-views'
import {setCommandFocus} from '@/renderer/redux/ui/uiSlice'
import {getNode} from '@/renderer/redux/nodes/helpers'

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

  const checkboxChecked = node.checkbox ? node.checkbox.state === 'checked' : undefined
  const setChecked = (checked: boolean) => {
    dispatch(checkboxUpdated({
      nodeId: node.id,
      checkbox: { type: 'intrinsic', state: checked ? 'checked' : 'unchecked' },
    }))
  }

  const _keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (['z', 'Z'].includes(e.key) && e.ctrlKey) {
      // Undo/Redo is handled globally, so prevent the browser's default behavior from interfering
      e.preventDefault()
      return
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault()
      const newState = cycleCheckboxState(node.checkbox?.state)
      if (newState !== undefined) {
        setChecked(newState === 'checked')
      } else {
        dispatch(checkboxUpdated({ nodeId: node.id, checkbox: undefined }))
      }
      return
    }
    if (e.key === 'k' && e.ctrlKey) {
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
          checkbox: { type: 'intrinsic', state: 'unchecked' },
        }))
        dispatch(titleUpdated({ nodeId: node.id, title: node.title.slice(2) }))
      }))
      return
    }
    onKeyDown?.(e)
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
          onCheckedChange={setChecked}
        />
      )}
      <TextareaAutosize
        ref={textAreaRef}
        className={textareaClasses}
        value={node.title}
        placeholder={'Empty'}
        onChange={e => dispatch(titleUpdated({ nodeId: node.id, title: e.target.value }))}
        onKeyDown={_keyDown}
      />
    </div>
  )
}
