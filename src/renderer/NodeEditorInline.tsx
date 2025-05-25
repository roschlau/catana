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
import {indentNode, mergeNode, outdentNode, Selection, splitNode} from './redux/nodes/thunks'
import {Node, NodeId, NodeReference} from '../common/nodeGraphModel'

interface NodeEditorRef {
  focus: (mode: 'first' | 'last') => void
}

export function NodeEditorInline({
                                   nodeRef,
                                   expanded,
                                   viewPath,
                                   moveFocusBefore,
                                   moveFocusAfter,
                                   indent,
                                   outdent,
                                   outdentChild,
                                   ref,
                                 }: {
  /** The node reference to render */
  nodeRef: NodeReference,
  expanded: boolean,
  /** A list of ancestor nodes of this editor in the current view. If there are node links in the view
   path, only _their_ ID should be included, and _not_ the ID of the nodes they point to. */
  viewPath: NodeId[],
  /** Called when the user attempts to move focus out of and before this node.
   Should return false if there is no previous node to move focus to, true otherwise. */
  moveFocusBefore?: () => boolean,
  /** Called when the user attempts to move focus out of and after this node.
   Should return false if there is no next node to move focus to, true otherwise. */
  moveFocusAfter?: () => boolean,
  /** Called when the user triggers the indent action on this node. */
  indent?: (nodeId: NodeId, selection: Selection) => void,
  /** Called when the user triggers the outdent action on this node. */
  outdent?: (nodeRef: NodeReference, selection: Selection) => void,
  /** Called when the user triggers the outdent action on a child node of this node. */
  outdentChild?: (nodeRef: NodeReference, selection: Selection) => void,
  ref?: Ref<NodeEditorRef>,
}) {
  const dispatch = useAppDispatch()
  const node = useAppSelector(state => state.nodes.present[nodeRef.nodeId]!)
  const parent = useAppSelector(state => nodeRef.parentId ? state.nodes.present[nodeRef.parentId] : undefined)
  const isLink = node.ownerId && parent && node.ownerId !== parent.id
  const childRefs = node.content
  const preparedFocusRestore = useAppSelector(selectPreparedFocusRestore)

  const isRecursiveInstance = viewPath.includes(node.id)
  // Control node expansion. Every node and node link stores its expansion state globally, but if we're looking at a
  // recursively nested instance of a node link we need to use a component-local override that defaults to false.
  // If we don't, the UI will crash in a recursive loop when such an instance is expanded.
  const [expandedLocalOverride, setExpandedLocalOverride] = useState(false)
  const isExpanded = isRecursiveInstance ? expandedLocalOverride : expanded
  const setExpanded = (expanded: boolean) => {
    if (isRecursiveInstance) {
      setExpandedLocalOverride(expanded)
    } else {
      dispatch(nodeExpandedChanged({ nodeRef, expanded }))
    }
  }

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const contentNodesList = useRef<NodeEditorRef | null>(null)

  useImperativeHandle(ref, () => ({
    focus: (mode: 'first' | 'last') => {
      if (mode === 'last' && isExpanded && childRefs.length > 0) {
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
    if (preparedFocusRestore?.nodeRef.nodeId === node.id && preparedFocusRestore?.nodeRef.parentId === parent?.id) {
      textAreaRef.current?.focus()
      textAreaRef.current?.setSelectionRange(preparedFocusRestore.selectionStart, preparedFocusRestore.selectionEnd)
      dispatch(focusRestored())
    }
  }, [node.id, preparedFocusRestore, dispatch, parent?.id])

  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const { selectionStart, selectionEnd } = e.currentTarget
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
      dispatch(nodeIndexChanged({ nodeRef, indexChange: 1 }))
      return
    }
    if (e.key === 'ArrowUp' && e.shiftKey && e.altKey) {
      e.preventDefault()
      dispatch(nodeIndexChanged({ nodeRef, indexChange: -1 }))
      return
    }
    if ((e.key === 'ArrowDown' && calculateCursorPosition(textarea).lastLine)
      || (e.key === 'ArrowRight' && selectionStart === textarea.value.length)) {
      if (isExpanded && childRefs.length > 0) {
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
    if ((e.key === 'ArrowUp' && calculateCursorPosition(textarea).firstLine)
      || (e.key === 'ArrowLeft' && selectionEnd === 0)) {
      if (moveFocusBefore?.()) {
        e.preventDefault()
      }
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.shiftKey) {
        outdent?.(nodeRef, { start: selectionStart, end: selectionEnd })
      } else {
        indent?.(node.id, { start: selectionStart, end: selectionEnd })
      }
      return
    }
    if (e.key === 'Enter') {
      // Not allowing any line breaks for now to simplify things. Might change my mind on that later.
      e.preventDefault()
      dispatch(splitNode(
        nodeRef,
        selectionStart,
        selectionEnd,
      ))
      return
    }
    if (e.key === 'Backspace') {
      if (isLink) {
        console.debug(`Can't merge linked node ${node.id} into surrounding nodes`)
        return
      }
      if (selectionStart === 0 && selectionEnd === selectionStart) {
        dispatch(mergeNode(nodeRef, 'prev'))
        e.preventDefault()
      }
      return
    }
    if (e.key === 'Delete') {
      if (isLink && (!isExpanded || node.content.length === 0)) {
        console.debug(`Can't merge linked node ${node.id} into surrounding nodes`)
        return
      }
      if (selectionStart === node.title.length && selectionEnd === selectionStart) {
        dispatch(mergeNode(nodeRef, 'next'))
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
          onClick={() => setExpanded(!isExpanded)}
        >
          {childRefs.length > 0
            ? <ChevronRightIcon style={{ rotate: isExpanded ? '90deg' : '0deg' }} color={'var(--gray-10)'}/>
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
      {isExpanded && childRefs.length > 0 && <NodeEditorList
          ref={contentNodesList}
          nodes={childRefs}
          viewPath={[...viewPath, node.id]}
          moveFocusBefore={focus}
          moveFocusAfter={moveFocusAfter}
          outdentChild={outdentChild}
      />}
    </Flex>
  )
}

export function NodeEditorList({ nodes, viewPath, moveFocusBefore, moveFocusAfter, outdentChild, ref }: {
  nodes: Node['content'],
  viewPath: NodeId[],
  moveFocusBefore?: () => boolean,
  moveFocusAfter?: () => boolean,
  /** Called when the user triggers the outdent action on a node within this list. */
  outdentChild?: (nodeRef: NodeReference, selection: Selection) => void,
  ref?: Ref<NodeEditorRef>,
}) {
  useImperativeHandle(ref, () => ({
    focus: (mode: 'first' | 'last') => {
      if (mode === 'last') {
        focusIndex(nodes.length - 1, 'last')
      } else {
        focusIndex(0, 'first')
      }
    },
  }))
  const dispatch = useAppDispatch()
  const parentId = viewPath[viewPath.length - 1]

  const childNodeRefs = useRef<(NodeEditorRef | null)[]>([])
  if (childNodeRefs.current.length !== nodes.length) {
    childNodeRefs.current = Array(nodes.length).fill(null)
  }

  const focusIndex = (index: number, mode: 'first' | 'last') => {
    if (index >= nodes.length) {
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

  const indent = (index: number, childId: NodeId, selection: Selection) => {
    if (index === 0) {
      // Can't indent a node that's already the first within its siblings
      return
    }
    // Indent node into previous preceding sibling
    dispatch(indentNode(
      { nodeId: childId, parentId },
      { nodeId: nodes[index - 1].nodeId, parentId },
      selection,
    ))
  }

  // Handles outdenting a child node of one of this list's nodes into this list
  const outdentChildOfChild = (index: number, nodeRef: NodeReference, selection: Selection) => {
    dispatch(outdentNode(nodeRef, parentId, index + 1, selection))
  }

  return (
    <ul style={{
      width: '100%',
      marginInlineStart: '12px',
      paddingInlineStart: '12px',
      borderLeft: '2px solid var(--gray-5)',
    }}>
      {nodes.map((contentNode, i) => <li key={contentNode.nodeId}>
        <NodeEditorInline
          nodeRef={{ nodeId: contentNode.nodeId, parentId: viewPath[viewPath.length - 1] }}
          expanded={contentNode.expanded ?? false}
          viewPath={viewPath}
          moveFocusBefore={() => focusIndex(i - 1, 'last')}
          moveFocusAfter={() => focusIndex(i + 1, 'first')}
          indent={(nodeId, selection) => indent(i, nodeId, selection)}
          outdent={outdentChild}
          outdentChild={(nodeRef, selection) => outdentChildOfChild(i, nodeRef, selection)}
          ref={el => {
            childNodeRefs.current[i] = el
          }}
        />
      </li>)}
    </ul>
  )
}
