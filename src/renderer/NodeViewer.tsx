import {Flex} from '@radix-ui/themes'
import {useAppDispatch, useAppSelector} from './redux/hooks'
import {selectContentNodeIds, selectNode, titleUpdated} from './redux/nodesSlice'
import TextareaAutosize from 'react-textarea-autosize'
import {ChevronRightIcon, DotFilledIcon} from '@radix-ui/react-icons'
import {KeyboardEvent, Ref, useCallback, useImperativeHandle, useRef, useState} from 'react'
import './NodeViewer.css'
import classNames from 'classnames'
import {calculateCursorPosition} from './util/textarea-measuring'

interface NodeViewerRef {
  focus: (mode: 'first' | 'last') => void
}

export function NodeViewer({ nodeId, viewParentId, onFocusPrevNode, onFocusNextNode, ref }: {
  nodeId: string,
  viewParentId?: string,
  onFocusPrevNode?: () => boolean,
  onFocusNextNode?: () => boolean,
  ref?: Ref<NodeViewerRef>,
}) {
  const dispatch = useAppDispatch()
  const node = useAppSelector(selectNode(nodeId))
  const contentNodeIds = useAppSelector(state => selectContentNodeIds(state, nodeId))
  const [expanded, setExpanded] = useState(true)

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const childNodeRefs = useRef<(NodeViewerRef | null)[]>([])

  useImperativeHandle(ref, () => ({
    focus: (mode: 'first' | 'last') => {
      if (mode === 'last' && expanded && contentNodeIds.length > 0) {
        focusChildAtIndex(contentNodeIds.length - 1, 'last')
      } else {
        textAreaRef.current?.focus()
      }
    },
  }))

  if (childNodeRefs.current.length !== contentNodeIds.length) {
    childNodeRefs.current = Array(contentNodeIds.length).fill(null)
  }

  const focusChildAtIndex = (index: number, mode: 'first' | 'last') => {
    if (index >= contentNodeIds.length) {
      // We stepped past our last child node, delegate to parent node
      return onFocusNextNode?.() || false
    }
    if (index < 0) {
      // We stepped before our first child node, delegate to parent node
      textAreaRef.current?.focus()
      return true
    }
    childNodeRefs.current[index]?.focus(mode)
    return true
  }

  const keyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
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
        focusChildAtIndex(0, 'first')
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
  }, [expanded, setExpanded, contentNodeIds])

  const chevronButtonClasses = classNames(
    'NodeViewer_chevron-button',
    { 'NodeViewer_chevron-button--link': viewParentId && viewParentId !== node.ownerNodeId },
  )

  return (
    <Flex direction={'column'} flexGrow={'1'} align={'center'}>
      <Flex direction={'row'} width={'100%'} gap={'1'} align={'center'}>
        <button
          className={chevronButtonClasses}
          onClick={() => setExpanded(!expanded)}
        >
          {contentNodeIds.length > 0
            ? <ChevronRightIcon style={{ rotate: expanded ? '90deg' : '0deg' }} color={'var(--gray-10)'}/>
            : <DotFilledIcon color={'var(--gray-10)'}/>}
        </button>
        <TextareaAutosize
          ref={textAreaRef}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            resize: 'none',
            color: 'var(--gray-11)',
            outline: 'none',
          }}
          value={node.title}
          onChange={e => dispatch(titleUpdated({ nodeId, title: e.target.value }))}
          onKeyDown={keyDown}
        />
      </Flex>
      {expanded && contentNodeIds.length > 0 && <ul style={{
        width: '100%',
        marginInlineStart: '12px',
        paddingInlineStart: '12px',
        borderLeft: '2px solid var(--gray-5)',
      }}>
        {contentNodeIds.map((contentNodeId, i) => <li key={contentNodeId}>
          <NodeViewer
            nodeId={contentNodeId}
            viewParentId={node.id}
            onFocusPrevNode={() => focusChildAtIndex(i - 1, 'last')}
            onFocusNextNode={() => focusChildAtIndex(i + 1, 'first')}
            ref={el => {
              childNodeRefs.current[i] = el
            }}
          />
        </li>)}
      </ul>}
    </Flex>
  )
}
