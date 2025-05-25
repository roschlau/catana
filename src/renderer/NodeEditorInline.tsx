import {Flex} from '@radix-ui/themes'
import {useAppDispatch, useAppSelector} from './redux/hooks'
import {nodeExpandedChanged, nodeIndexChanged} from './redux/nodes/nodesSlice'
import {ChevronRightIcon, DotFilledIcon} from '@radix-ui/react-icons'
import {KeyboardEvent, Ref, useCallback, useImperativeHandle, useRef, useState} from 'react'
import './NodeEditor.css'
import classNames from 'classnames'
import {calculateCursorPosition} from './util/textarea-measuring'
import {useFocusRestore} from './redux/ui/uiSlice'
import {mergeNode, Selection, splitNode} from './redux/nodes/thunks'
import {NodeId, NodeReference} from '../common/nodeGraphModel'
import {NodeTitleEditorTextField, NodeTitleEditorTextFieldRef} from './NodeTitleEditorTextField'
import {NodeEditorList, NodeEditorListRef} from './NodeEditorList'

export interface NodeEditorRef {
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
  /** True if this node editor is shown under a different node than the node's owner. */
  const isLink = !!parent && (!node.ownerId || node.ownerId !== parent.id)
  const childRefs = node.content

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

  const titleEditorRef = useRef<NodeTitleEditorTextFieldRef | null>(null)
  const contentNodesList = useRef<NodeEditorListRef | null>(null)

  useImperativeHandle(ref, () => ({
    focus: (mode: 'first' | 'last') => {
      if (mode === 'last' && isExpanded && childRefs.length > 0) {
        contentNodesList.current?.focus(mode)
      } else {
        titleEditorRef.current?.focus()
      }
    },
  }))

  const focus = useCallback(() => {
    titleEditorRef.current?.focus()
    return true
  }, [titleEditorRef])

  useFocusRestore(nodeRef, (selection) => {
    titleEditorRef.current?.focus(selection)
  })

  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const { selectionStart, selectionEnd } = e.currentTarget
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
        dispatch(mergeNode(nodeRef, viewPath, 'prev'))
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
        dispatch(mergeNode(nodeRef, viewPath, 'next'))
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
        <NodeTitleEditorTextField
          ref={titleEditorRef}
          keyDown={keyDown}
          node={node}
        />
      </Flex>
      {isExpanded && childRefs.length > 0 && <Flex direction={'row'} width={'100%'}>
          <div style={{ width: '2px', margin: '0 12px 0 6px', background: 'var(--gray-5)' }}></div>
          <NodeEditorList
              ref={contentNodesList}
              nodes={childRefs}
              viewPath={[...viewPath, node.id]}
              moveFocusBefore={focus}
              moveFocusAfter={moveFocusAfter}
              outdentChild={outdentChild}
          />
      </Flex>}
    </Flex>
  )
}
