import {Flex} from '@radix-ui/themes'
import {useAppDispatch, useAppSelector} from './redux/hooks'
import {
  indentNode,
  outdentNode,
  selectContentNodeIds,
  selectResolvedNode,
  splitNode,
  titleUpdated,
} from './redux/nodes/nodesSlice'
import TextareaAutosize from 'react-textarea-autosize'
import {ChevronRightIcon, DotFilledIcon} from '@radix-ui/react-icons'
import {KeyboardEvent, Ref, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react'
import './NodeEditor.css'
import classNames from 'classnames'
import {calculateCursorPosition} from './util/textarea-measuring'
import {focusRestored, selectPreparedFocusRestore} from './redux/ui/uiSlice'

interface NodeEditorRef {
  focus: (mode: 'first' | 'last') => void
}

/**
 * @param nodeId The ID of the node to render
 * @param viewPath A list of ancestor nodes of this editor in the current view. Necessary to correctly outdent nodes.
 * @param onFocusPrevNode Called when the user presses the up arrow while in the first line of text within this node.
 *                        Should return false if there is no previous node to focus, true otherwise.
 * @param onFocusNextNode Called when the user presses the down arrow while in the last line of text within this node.
 *                        Should return false if there is no next node to focus, true otherwise.
 * @param ref
 */
export function NodeEditorInline({ nodeId, viewPath, onFocusPrevNode, onFocusNextNode, ref }: {
  nodeId: string,
  viewPath: string[],
  onFocusPrevNode?: () => boolean,
  onFocusNextNode?: () => boolean,
  ref?: Ref<NodeEditorRef>,
}) {
  const dispatch = useAppDispatch()
  const { node, link } = useAppSelector(state => selectResolvedNode(state, nodeId))
  const contentNodeIds = useAppSelector(state => selectContentNodeIds(state, node.id))
  const preparedFocusRestore = useAppSelector(selectPreparedFocusRestore)
  const [expanded, setExpanded] = useState(viewPath.length < 3) // Only auto-expand the first three levels so the UI doesn't freeze up on cyclic Node graphs

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const contentNodesList = useRef<NodeEditorRef | null>(null)

  useImperativeHandle(ref, () => ({
    focus: (mode: 'first' | 'last') => {
      if (mode === 'last' && expanded && contentNodeIds.length > 0) {
        contentNodesList.current?.focus(mode)
      } else {
        textAreaRef.current?.focus()
      }
    },
  }))

  const focus = useCallback(() => {
    textAreaRef.current?.focus()
    return true
  }, [textAreaRef])

  useEffect(() => {
    if (preparedFocusRestore?.nodeId === nodeId) {
      textAreaRef.current?.focus()
      textAreaRef.current?.setSelectionRange(preparedFocusRestore.selectionStart, preparedFocusRestore.selectionEnd)
      dispatch(focusRestored())
    }
  }, [nodeId, preparedFocusRestore, dispatch])

  const keyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && ['z', 'Z'].includes(e.key)) {
      // Undo/Redo is handled globally, so prevent the browser here to prevent weird behavior
      e.preventDefault()
      return
    }
    if (e.ctrlKey && e.key === 'ArrowUp') {
      e.preventDefault()
      setExpanded(false)
      return
    }
    if (e.ctrlKey && e.key === 'ArrowDown') {
      e.preventDefault()
      setExpanded(true)
      return
    }
    if (e.key === 'ArrowDown') {
      const textarea = e.currentTarget
      if (!calculateCursorPosition(textarea).lastLine) {
        return
      }
      if (expanded && contentNodeIds.length > 0) {
        contentNodesList.current?.focus('first')
        e.preventDefault()
      } else {
        // Delegate to parent node
        if (onFocusNextNode?.()) {
          e.preventDefault()
        }
      }
    }
    if (e.key === 'ArrowUp') {
      const textarea = e.currentTarget
      if (!calculateCursorPosition(textarea).firstLine) {
        return
      }
      if (onFocusPrevNode?.()) {
        e.preventDefault()
      }
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        dispatch(outdentNode(nodeId, viewPath, e.currentTarget))
      } else {
        dispatch(indentNode(nodeId, e.currentTarget))
      }
    }
    if (e.key === 'Enter') {
      // Not allowing any line breaks for now to simplify things. Might change my mind on that later.
      e.preventDefault()
      dispatch(splitNode(
        nodeId,
        expanded && contentNodeIds.length > 0,
        e.currentTarget.selectionStart,
        e.currentTarget.selectionEnd,
      ))
    }
  }, [expanded, setExpanded, contentNodeIds])

  const chevronButtonClasses = classNames(
    'NodeEditor_chevron-button',
    { 'NodeEditor_chevron-button--link': !!link },
  )

  return (
    <Flex direction={'column'} flexGrow={'1'} align={'center'}>
      <Flex direction={'row'} width={'100%'} gap={'1'} align={'start'}>
        <button
          style={{marginTop: '.4rem'}}
          className={chevronButtonClasses}
          onClick={() => setExpanded(!expanded)}
        >
          {contentNodeIds.length > 0
            ? <ChevronRightIcon style={{ rotate: expanded ? '90deg' : '0deg' }} color={'var(--gray-10)'}/>
            : <DotFilledIcon color={'var(--gray-10)'}/>}
        </button>
        <TextareaAutosize
          ref={textAreaRef}
          className={'NodeEditor_textarea'}
          value={node.title}
          onChange={e => dispatch(titleUpdated({ nodeId: node.id, title: e.target.value }))}
          onKeyDown={keyDown}
        />
      </Flex>
      {expanded && contentNodeIds.length > 0 && <NodeEditorList
          ref={contentNodesList}
          nodeIds={contentNodeIds}
          viewPath={[...viewPath, nodeId]}
          onFocusMovedBefore={focus}
          onFocusMovedAfter={onFocusNextNode}
      />}
    </Flex>
  )
}

export function NodeEditorList({ nodeIds, viewPath, onFocusMovedAfter, onFocusMovedBefore, ref }: {
  nodeIds: string[],
  viewPath: string[],
  onFocusMovedAfter?: () => boolean,
  onFocusMovedBefore?: () => boolean,
  ref?: Ref<NodeEditorRef>,
}) {
  useImperativeHandle(ref, () => ({
    focus: (mode: 'first' | 'last') => {
      if (mode === 'last') {
        focusIndex(nodeIds.length - 1, 'last')
      } else {
        focusIndex(0, 'first')
      }
    },
  }))

  const childNodeRefs = useRef<(NodeEditorRef | null)[]>([])
  if (childNodeRefs.current.length !== nodeIds.length) {
    childNodeRefs.current = Array(nodeIds.length).fill(null)
  }

  const focusIndex = (index: number, mode: 'first' | 'last') => {
    if (index >= nodeIds.length) {
      // We stepped past our last child node, delegate to parent node
      return onFocusMovedAfter?.() || false
    }
    if (index < 0) {
      // We stepped before our first child node, delegate to parent node
      return onFocusMovedBefore?.() || false
    }
    childNodeRefs.current[index]?.focus(mode)
    return true
  }

  return (
    <ul style={{
      width: '100%',
      marginInlineStart: '12px',
      paddingInlineStart: '12px',
      borderLeft: '2px solid var(--gray-5)',
    }}>
      {nodeIds.map((contentNodeId, i) => <li key={contentNodeId}>
        <NodeEditorInline
          nodeId={contentNodeId}
          viewPath={viewPath}
          onFocusPrevNode={() => focusIndex(i - 1, 'last')}
          onFocusNextNode={() => focusIndex(i + 1, 'first')}
          ref={el => {
            childNodeRefs.current[i] = el
          }}
        />
      </li>)}
    </ul>
  )
}
