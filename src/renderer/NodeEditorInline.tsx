import {Flex} from '@radix-ui/themes'
import {useAppDispatch, useAppSelector} from './redux/hooks'
import {nodeExpandedChanged, nodeIndexChanged, titleUpdated} from './redux/nodes/nodesSlice'
import TextareaAutosize from 'react-textarea-autosize'
import {ChevronRightIcon, DotFilledIcon} from '@radix-ui/react-icons'
import {KeyboardEvent, Ref, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react'
import './NodeEditor.css'
import classNames from 'classnames'
import {calculateCursorPosition} from './util/textarea-measuring'
import {focusRestored, selectPreparedFocusRestore} from './redux/ui/uiSlice'
import {selectResolvedNode} from './redux/nodes/selectors'
import {indentNode, mergeNode, outdentNode, Selection, splitNode} from './redux/nodes/thunks'
import {NodeId} from '../common/nodeGraphModel'

interface NodeEditorRef {
  focus: (mode: 'first' | 'last') => void
}

export function NodeEditorInline({ nodeId, viewPath, moveFocusBefore, moveFocusAfter, indent, outdent, outdentChild, ref }: {
  /** The ID of the node to render */
  nodeId: NodeId,
  /** A list of ancestor nodes of this editor in the current view. If there are node links in the view
      path, only _their_ ID should be included, and _not_ the ID of the nodes they point to. */
  viewPath: NodeId[],
  /** Called when the user presses the up arrow while in the first line of text within this node.
      Should return false if there is no previous node to move focus to, true otherwise. */
  moveFocusBefore?: () => boolean,
  /** Called when the user presses the down arrow while in the last line of text within this node.
      Should return false if there is no next node to move focus to, true otherwise. */
  moveFocusAfter?: () => boolean,
  /** Called when the user triggers the indent action on this node. */
  indent?: (nodeId: NodeId, selection: Selection) => void,
  /** Called when the user triggers the outdent action on this node. */
  outdent?: (nodeId: NodeId, selection: Selection) => void,
  /** Called when the user triggers the outdent action on a child node of this node. */
  outdentChild?: (nodeId: NodeId, selection: Selection) => void,
  ref?: Ref<NodeEditorRef>,
}) {
  const dispatch = useAppDispatch()
  const { node, link } = useAppSelector(state => selectResolvedNode(state, nodeId))
  const viewParentId = viewPath[viewPath.length - 1]
  const viewParent = useAppSelector(state => viewParentId ? selectResolvedNode(state, viewParentId) : undefined)
  const isLink = !!link || (node.parentNodeId && viewParent && node.parentNodeId !== viewParent.node.id)
  if (isLink && !link) {
    // Implicit linking will work for display, but it breaks assumptions the rest of the app makes about how the node
    // graph behaves. This indicates a bug somewhere and should not be ignored.
    console.error(`Node ${node.id} implicitly linked to by ${viewParentId}`)
  }
  const contentNodeIds = node.contentNodeIds
  const preparedFocusRestore = useAppSelector(selectPreparedFocusRestore)

  const isRecursiveInstance = viewPath.includes(nodeId)
  // Control node expansion. Every node and node link stores its expansion state globally, but if we're looking at a
  // recursively nested instance of a node link we need to use a component-local override that defaults to false.
  // If we don't, the UI will crash in a recursive loop when such an instance is expanded.
  const [expandedLocalOverride, setExpandedLocalOverride] = useState(false)
  const expanded = isRecursiveInstance ? expandedLocalOverride : (link ?? node).expanded
  const setExpanded = (expanded: boolean) => {
    if (isRecursiveInstance) {
      setExpandedLocalOverride(expanded)
    } else {
      dispatch(nodeExpandedChanged({ nodeId, expanded }))
    }
  }

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

  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (['z', 'Z'].includes(e.key) && e.ctrlKey) {
      // Undo/Redo is handled globally, so prevent the browser here to prevent weird behavior
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault()
      setExpanded(false)
      return
    }
    if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault()
      setExpanded(true)
      return
    }
    if (e.key === 'ArrowDown' && e.shiftKey && e.altKey) {
      e.preventDefault()
      dispatch(nodeIndexChanged({ nodeId, indexChange: 1 }))
      return
    }
    if (e.key === 'ArrowUp' && e.shiftKey && e.altKey) {
      e.preventDefault()
      dispatch(nodeIndexChanged({ nodeId, indexChange: -1 }))
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
        if (moveFocusAfter?.()) {
          e.preventDefault()
        }
      }
      return
    }
    if (e.key === 'ArrowUp') {
      const textarea = e.currentTarget
      if (!calculateCursorPosition(textarea).firstLine) {
        return
      }
      if (moveFocusBefore?.()) {
        e.preventDefault()
      }
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const { selectionStart, selectionEnd } = e.currentTarget
      if (e.shiftKey) {
        outdent?.(nodeId, { start: selectionStart, end: selectionEnd })
      } else {
        indent?.(nodeId, { start: selectionStart, end: selectionEnd })
      }
      return
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
      return
    }
    if (e.key === 'Backspace') {
      if (isLink) {
        console.debug(`Can't merge link node ${link?.id} into surrounding nodes`)
        return
      }
      const { selectionStart, selectionEnd } = e.currentTarget
      if (selectionStart === 0 && selectionEnd === selectionStart) {
        dispatch(mergeNode(node.id, 'prev', expanded))
        e.preventDefault()
      }
      return
    }
    if (e.key === 'Delete') {
      if (isLink && (!expanded || node.contentNodeIds.length === 0)) {
        console.debug(`Can't merge link node ${link?.id} into surrounding nodes`)
        return
      }
      const { selectionStart, selectionEnd } = e.currentTarget
      if (selectionStart === node.title.length && selectionEnd === selectionStart) {
        dispatch(mergeNode(node.id, 'next', expanded))
        e.preventDefault()
      }
      return
    }
  }

  const chevronButtonClasses = classNames(
    'NodeEditor_chevron-button',
    { 'NodeEditor_chevron-button--link': isLink },
  )

  return (
    <Flex direction={'column'} flexGrow={'1'} align={'center'}>
      <Flex direction={'row'} width={'100%'} gap={'1'} align={'start'}>
        <button
          style={{ marginTop: '.4rem' }}
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
          moveFocusBefore={focus}
          moveFocusAfter={moveFocusAfter}
          outdentChild={outdentChild}
      />}
    </Flex>
  )
}

export function NodeEditorList({ nodeIds, viewPath, moveFocusBefore, moveFocusAfter, outdentChild, ref }: {
  nodeIds: NodeId[],
  viewPath: NodeId[],
  moveFocusBefore?: () => boolean,
  moveFocusAfter?: () => boolean,
  /** Called when the user triggers the outdent action on a node within this list. */
  outdentChild?: (nodeId: NodeId, selection: Selection) => void,
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
  const dispatch = useAppDispatch()

  const childNodeRefs = useRef<(NodeEditorRef | null)[]>([])
  if (childNodeRefs.current.length !== nodeIds.length) {
    childNodeRefs.current = Array(nodeIds.length).fill(null)
  }

  const focusIndex = (index: number, mode: 'first' | 'last') => {
    if (index >= nodeIds.length) {
      // We stepped past our last child node, delegate to parent node
      return moveFocusAfter?.() || false
    }
    if (index < 0) {
      // We stepped before our first child node, delegate to parent node
      return moveFocusBefore?.() || false
    }
    childNodeRefs.current[index]?.focus(mode)
    return true
  }

  const indent = (index: number, nodeId: NodeId, selection: Selection) => {
    if (index === 0) {
      // Can't indent a node that's already the first within its siblings
      return
    }
    // Indent node into previous preceding sibling
    dispatch(indentNode(nodeId, nodeIds[index - 1], selection))
  }

  // Handles outdenting a child node of one of this list's nodes into this list
  const outdentChildOfChild = (index: number, nodeId: NodeId, selection: Selection) => {
    const parentId = viewPath[viewPath.length - 1]
    dispatch(outdentNode(nodeId, parentId, index + 1, selection))
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
          moveFocusBefore={() => focusIndex(i - 1, 'last')}
          moveFocusAfter={() => focusIndex(i + 1, 'first')}
          indent={(nodeId, selection) => indent(i, nodeId, selection)}
          outdent={outdentChild}
          outdentChild={(nodeId, selection) => outdentChildOfChild(i, nodeId, selection)}
          ref={el => {
            childNodeRefs.current[i] = el
          }}
        />
      </li>)}
    </ul>
  )
}
