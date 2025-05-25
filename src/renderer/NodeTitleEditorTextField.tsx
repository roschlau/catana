import TextareaAutosize from 'react-textarea-autosize'
import {titleUpdated} from './redux/nodes/nodesSlice'
import {Node} from '../common/nodeGraphModel'
import {KeyboardEvent, Ref, useImperativeHandle, useRef} from 'react'
import {useAppDispatch} from './redux/hooks'
import {Selection} from './redux/nodes/thunks'

export interface NodeTitleEditorTextFieldRef {
  focus: (selection?: Selection) => void
}

/**
 * Displays a text area for the user to edit the title of a node.
 * Handles dispatching actions for title editing itself, any other input is passed to the parent via `keyDown`.
 */
export function NodeTitleEditorTextField({ node, keyDown, ref }: {
  node: Node,
  /** Passed through unchanged from the underlying textarea, except for preventing the browser's default for Ctrl+Z. */
  keyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void,
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

  const _keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (['z', 'Z'].includes(e.key) && e.ctrlKey) {
      // Undo/Redo is handled globally, so prevent stop the browser from interfering
      e.preventDefault()
      return
    }
    keyDown?.(e)
  }

  return <TextareaAutosize
    ref={textAreaRef}
    className={'NodeEditor_textarea'}
    value={node.title}
    onChange={e => dispatch(titleUpdated({ nodeId: node.id, title: e.target.value }))}
    onKeyDown={_keyDown}
  />
}
