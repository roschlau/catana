import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {
  checkboxUpdated,
  nodeExpandedChanged,
  nodeIndexChanged,
  nodeLinkRemoved,
} from '@/renderer/redux/nodes/nodesSlice'
import {KeyboardEvent, MouseEvent, Ref, useCallback, useImperativeHandle, useMemo, useRef, useState} from 'react'
import classNames from 'classnames'
import {calculateCursorPosition} from '@/renderer/util/textarea-measuring'
import {focusRestoreRequested, nodeOpened, useFocusRestore} from '@/renderer/redux/ui/uiSlice'
import {Selection} from '@/renderer/util/selection'
import {isRecursive, NodeViewWithParent} from '@/common/node-views'
import {
  NodeTitleEditorTextField,
  NodeTitleEditorTextFieldRef,
} from '@/renderer/components/node-editor/NodeTitleEditorTextField'
import {EditorBlockList, EditorBlockListRef} from '@/renderer/components/node-editor/EditorBlockList'
import {ChevronRight} from 'lucide-react'
import {getNode} from '@/renderer/redux/nodes/helpers'
import {ListItem} from '@/renderer/components/ui/list-item'
import {twMerge} from 'tailwind-merge'
import {Node, TextNode} from '@/common/nodes'
import {mergeNodeBackward, mergeNodeForward, splitNode} from '@/renderer/redux/nodes/split-merge-thunks'
import {deleteNodeTree} from '@/renderer/redux/nodes/delete-node-tree-thunk'

export interface NodeEditorRef {
  focus: (mode: 'first' | 'last') => void
}

export function TextNodeBlock({
  className,
  nodeView,
  expanded,
  moveFocusBefore,
  moveFocusAfter,
  indent,
  outdent,
  outdentChild,
  ref,
}: {
  className?: string,
  /** The node view to render */
  nodeView: NodeViewWithParent<TextNode>,
  expanded: boolean,
  /** Called when the user attempts to move focus out of and before this node.
   Should return false if there is no previous node to move focus to, true otherwise. */
  moveFocusBefore?: () => boolean,
  /** Called when the user attempts to move focus out of and after this node.
   Should return false if there is no next node to move focus to, true otherwise. */
  moveFocusAfter?: () => boolean,
  /** Called when the user triggers the indent action on this node. */
  indent?: (selection: Selection) => void,
  /** Called when the user triggers the outdent action on this node. */
  outdent?: (selection: Selection) => void,
  /** Called when the user triggers the outdent action on a child node of this node. */
  outdentChild?: (nodeRef: NodeViewWithParent<Node>, selection: Selection) => void,
  ref?: Ref<NodeEditorRef>,
}) {
  const dispatch = useAppDispatch()
  const node = useAppSelector(state => getNode(state.undoable.present.nodes, nodeView.nodeId))
  const parent = useAppSelector(state => state.undoable.present.nodes[nodeView.parent.nodeId]!)
  /** True if this node editor is shown under a different node than the node's owner. */
  const isLink = !!parent && (!node.ownerId || node.ownerId !== parent.id)
  const childRefs = node.content

  const isRecursiveInstance = useMemo(() => isRecursive(nodeView.parent), [nodeView])
  // Control node expansion. Every node stores the expansion state of its children globally, but if we're looking at a
  // node that's already shown under the same parent further up the view tree, we need to use a component-local override
  // that defaults to false. If we don't, the UI will crash in a recursive loop.
  const [expandedLocalOverride, setExpandedLocalOverride] = useState(false)
  const isExpanded = isRecursiveInstance ? expandedLocalOverride : expanded
  const setExpanded = (expanded: boolean) => {
    if (isRecursiveInstance) {
      setExpandedLocalOverride(expanded)
    } else {
      dispatch(nodeExpandedChanged({ nodeView, expanded }))
    }
  }
  const zoomIn = () => {
    dispatch(nodeOpened({ nodeId: node.id }))
  }
  const bulletClicked = (e: MouseEvent) => {
    if (e.ctrlKey) {
      zoomIn()
    } else {
      setExpanded(!isExpanded)
    }
  }

  const titleEditorRef = useRef<NodeTitleEditorTextFieldRef | null>(null)
  const contentNodesList = useRef<EditorBlockListRef | null>(null)

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

  useFocusRestore(nodeView, (selection) => {
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
    if (e.key === 'ArrowRight' && e.altKey) {
      e.preventDefault()
      zoomIn()
      dispatch(focusRestoreRequested({
        nodeRef: { nodeId: node.id },
        selection: { start: selectionStart, end: selectionEnd },
      }))
      return
    }
    if (e.key === 'ArrowDown' && e.shiftKey && e.altKey) {
      e.preventDefault()
      dispatch(nodeIndexChanged({ nodeView, indexChange: 1 }))
      return
    }
    if (e.key === 'ArrowUp' && e.shiftKey && e.altKey) {
      e.preventDefault()
      dispatch(nodeIndexChanged({ nodeView, indexChange: -1 }))
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
        outdent?.({ start: selectionStart, end: selectionEnd })
      } else {
        indent?.({ start: selectionStart, end: selectionEnd })
      }
      return
    }
    if (e.key === 'Enter') {
      // Not allowing any line breaks for now to simplify things. Might change my mind on that later.
      e.preventDefault()
      dispatch(splitNode(
        nodeView,
        selectionStart,
        selectionEnd,
      ))
      return
    }
    if (e.key === 'Backspace' && e.ctrlKey && e.shiftKey) {
      e.preventDefault()
      if (isLink) {
        dispatch(nodeLinkRemoved({ nodeView }))
      } else {
        dispatch(deleteNodeTree(node.id))
      }
      return
    }
    if (e.key === 'Backspace') {
      if (isLink) {
        console.debug(`Can't merge linked node ${node.id} into surrounding nodes`)
        return
      }
      if (selectionStart === 0 && selectionEnd === selectionStart) {
        if (node.checkbox?.type === 'intrinsic') {
          dispatch(checkboxUpdated({ nodeId: node.id, checkbox: undefined }))
        } else {
          dispatch(mergeNodeBackward(nodeView))
        }
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
        dispatch(mergeNodeForward(nodeView))
        e.preventDefault()
      }
      return
    }
  }

  return (
    <div className={twMerge('flex flex-col grow', className)}>
      <ListItem>
        <TextNodeBulletButton
          isLink={isLink}
          hasContent={childRefs.length > 0}
          isExpanded={isExpanded}
          bulletClicked={bulletClicked}
        />
        <NodeTitleEditorTextField
          ref={titleEditorRef}
          nodeView={nodeView}
          onKeyDown={keyDown}
        />
      </ListItem>
      {isExpanded && childRefs.length > 0 && (
        <ListItem>
          <div className={'w-4 self-stretch grid justify-center'}>
            <div className={'w-0.5 bg-border'}></div>
          </div>
          <EditorBlockList
            className={'grow'}
            ref={contentNodesList}
            nodes={childRefs}
            parentView={nodeView}
            moveFocusBefore={focus}
            moveFocusAfter={moveFocusAfter}
            outdentChild={outdentChild}
          />
        </ListItem>)
      }
    </div>
  )
}

export function TextNodeBulletButton({ isLink, hasContent, isExpanded, disabled, bulletClicked }: {
  isLink: boolean,
  hasContent: boolean,
  isExpanded: boolean,
  disabled?: boolean,
  bulletClicked: (e: MouseEvent<HTMLButtonElement>) => void,
}) {
  const toggleButtonClasses = classNames(
    'mt-1 size-4 shrink-0 grid place-content-center rounded-full cursor-pointer text-foreground/50',
    'hover:bg-accent hover:text-foreground',
    { 'outline -outline-offset-1 outline-dashed outline-foreground/40': isLink },
  )

  const chevronIconClasses = classNames(
    'transition-all',
    isExpanded ? 'rotate-90' : 'rotate-0',
  )
  return (
    <button
      className={toggleButtonClasses}
      disabled={disabled}
      onClick={bulletClicked}
    >
      {hasContent
        ? <ChevronRight size={16} className={chevronIconClasses}/>
        : <div className={'size-1 rounded-full bg-current'}/>}
    </button>
  )
}
