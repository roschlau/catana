import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {
  checkboxUpdated,
  nodeExpandedChanged,
  nodeIndexChanged,
  nodeLinkRemoved,
  nodeTreeDeleted,
  selectIsLastNode,
  selectIsLink,
  selectNodeFromNodeView,
} from '@/renderer/features/node-graph/nodes-slice'
import {KeyboardEvent, MouseEvent, Ref, useCallback, useImperativeHandle, useMemo, useRef, useState} from 'react'
import classNames from 'classnames'
import {calculateCursorPosition} from '@/renderer/util/textarea-measuring'
import {focusRestoreRequested, useFocusRestore} from '@/renderer/features/ui/uiSlice'
import {Selection} from '@/renderer/util/selection'
import {isRecursive, NodeViewWithParent, serialize} from '@/common/node-views'
import {NodeEditor, NodeTitleEditorTextFieldRef} from '@/renderer/features/node-editor/node-editor'
import {EditorBlockList, EditorBlockListRef} from '@/renderer/components/node-editor/EditorBlockList'
import {ChevronRight, FullscreenIcon} from 'lucide-react'
import {ListItem} from '@/renderer/components/ui/list-item'
import {twMerge} from 'tailwind-merge'
import {TextNode} from '@/common/nodes'
import {mergeNodeBackward, mergeNodeForward, splitNode} from '@/renderer/features/node-graph/split-merge-thunks'
import {deleteNodeTree} from '@/renderer/features/node-graph/delete-node-tree'
import {modKey} from '@/renderer/util/keyboard'
import {nodeOpened} from '@/renderer/features/navigation/navigation-slice'
import {indentNode, outdentNode} from '@/renderer/features/node-graph/indent-outdent'
import {useEventListener} from '@/renderer/hooks/use-event-listener'
import {displayWarning} from '@/renderer/features/ui/toasts'
import {duplicateSubtree} from '@/renderer/features/node-graph/duplicate-subtree'
import {expandAllChildren} from '@/renderer/features/node-graph/expand-all-children'
import {TagAccentColorProvider} from '@/renderer/features/tags/tag-accent-color-provider'
import {selectPrimaryTag} from '@/renderer/features/tags/tags-slice'

export interface NodeEditorRef {
  focus: (mode: 'first' | 'last') => void
}

export function TextNodeBlock({
  className,
  nodeView,
  expanded,
  moveFocusBefore,
  moveFocusAfter,
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
  ref?: Ref<NodeEditorRef>,
}) {
  const dispatch = useAppDispatch()
  const node = useAppSelector(state => selectNodeFromNodeView<TextNode>(state, nodeView))
  const primaryTag = useAppSelector(state => selectPrimaryTag(state, node))
  /** True if this node editor is shown under a different node than the node's owner. */
  const isLink = useAppSelector(state => selectIsLink(state, nodeView))
  const isLastNode = useAppSelector(state => selectIsLastNode(state, nodeView))
  const childRefs = node.content

  const isRecursiveInstance = useMemo(() => isRecursive(nodeView.parent), [nodeView])
  // Control node expansion. Every node stores the expansion state of its children globally, but if we're looking at a
  // node that's already shown under the same parent further up the view tree, we need to use a component-local override
  // that defaults to false. If we don't, the UI will crash in a recursive loop.
  const [expandedLocalOverride, setExpandedLocalOverride] = useState(false)
  const isExpanded = isRecursiveInstance ? expandedLocalOverride : expanded
  const setExpanded = useCallback((expanded: boolean) => {
    if (isRecursiveInstance) {
      setExpandedLocalOverride(expanded)
    } else {
      dispatch(nodeExpandedChanged({ nodeView, expanded }))
    }
  }, [dispatch, isRecursiveInstance, nodeView])
  const zoomIn = useCallback(() => {
    dispatch(nodeOpened({ nodeId: node.id }))
  }, [dispatch, node.id])
  const bulletClicked = (e: MouseEvent) => {
    if (modKey(e)) {
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
        titleEditorRef.current?.focus(
          mode === 'last'
            ? { start: node.title.length, end: node.title.length }
            : { start: 0, end: 0 },
        )
      }
    },
  }))

  const focusEnd = useCallback(() => {
    titleEditorRef.current?.focus({ start: node.title.length, end: node.title.length })
    return true
  }, [node.title.length])

  useFocusRestore(nodeView, (selection) => {
    titleEditorRef.current?.focus(selection)
  })

  const keyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const { selectionStart, selectionEnd } = e.currentTarget
    const selection: Selection = { start: selectionStart, end: selectionEnd }
    if (e.key === 'ArrowUp' && modKey(e)) {
      e.preventDefault()
      setExpanded(false)
      return
    }
    if (e.key === 'ArrowDown' && modKey(e)) {
      e.preventDefault()
      setExpanded(true)
      return
    }
    if (e.key === 'ArrowRight' && e.altKey) {
      e.preventDefault()
      zoomIn()
      dispatch(focusRestoreRequested({
        nodeView: { nodeId: node.id },
        selection,
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
        dispatch(outdentNode(nodeView, selection))
      } else {
        dispatch(indentNode(nodeView, selection))
      }
      return
    }
    if (e.key === 'Enter') {
      // Not allowing any line breaks for now to simplify things. Might change my mind on that later.
      e.preventDefault()
      if (node.title === '' && isLastNode) {
        // Outdent node instead of adding additional empty nodes
        dispatch(outdentNode(nodeView, selection))
      } else {
        dispatch(splitNode(
          nodeView,
          selectionStart,
          selectionEnd,
        ))
      }
      return
    }
    if (e.key === 'Backspace' && modKey(e) && e.shiftKey) {
      e.preventDefault()
      if (isLink) {
        dispatch(nodeLinkRemoved({ nodeView }))
      } else {
        dispatch(deleteNodeTree(node.id))
      }
      // Move focus to the previous node in the current view so that you can delete a bunch of nodes quickly
      moveFocusBefore?.()
      return
    }
    if (e.key === 'Backspace') {
      if (selectionStart === 0 && selectionEnd === selectionStart) {
        e.preventDefault()
        if (isLink) {
          displayWarning(`Linked node can't be merged into previous node`, { logData: { nodeId: node.id } })
          return
        }
        if (node.checkbox !== undefined) {
          dispatch(checkboxUpdated({ nodeId: node.id, state: null }))
        } else if (node.title === '' && node.content.length === 0) {
          // More intuitive behavior for empty nodes
          dispatch(nodeTreeDeleted({ nodeId: node.id }))
          moveFocusBefore?.()
        } else {
          dispatch(mergeNodeBackward(nodeView))
        }
      }
      return
    }
    if (e.key === 'Delete') {
      if (selectionStart === node.title.length && selectionEnd === selectionStart) {
        if (isLink && (!isExpanded || node.content.length === 0)) {
          displayWarning(`Linked node can't be merged into next node`, { logData: { nodeId: node.id } })
          return
        }
        e.preventDefault()
        dispatch(mergeNodeForward(nodeView))
      }
      return
    }
    if (e.key === 'd' && modKey(e)) {
      e.preventDefault()
      if (isLink) {
        displayWarning(`Linked nodes can't be duplicated`, { logData: { nodeId: node.id } })
        return
      }
      dispatch(duplicateSubtree(nodeView))
      return
    }
  }, [setExpanded, zoomIn, dispatch, node.id, node.title, node.checkbox, node.content.length, nodeView, isExpanded, childRefs.length, moveFocusAfter, moveFocusBefore, isLastNode, isLink])

  return (
    <div className={twMerge('flex flex-col grow', className)}>
      <TagAccentColorProvider hue={primaryTag?.hue}>
        <ListItem>
          <TextNodeBulletButton
            isLink={isLink}
            hasContent={childRefs.length > 0}
            isExpanded={isExpanded}
            isTagged={!!primaryTag}
            bulletClicked={bulletClicked}
          />
          <NodeEditor
            ref={titleEditorRef}
            nodeView={serialize(nodeView)}
            onKeyDown={keyDown}
          />
        </ListItem>
      </TagAccentColorProvider>
      {isExpanded && childRefs.length > 0 && (
        <ListItem>
          <button
            className={'group w-4 shrink-0 mb-1 self-stretch grid justify-center cursor-pointer'}
            onClick={() => dispatch(expandAllChildren(nodeView))}
          >
            <div className={'w-0.5 group-hover:w-1.5 rounded-full bg-border transition-all'}></div>
          </button>
          <EditorBlockList
            className={'grow'}
            ref={contentNodesList}
            nodes={childRefs}
            parentView={nodeView}
            moveFocusBefore={focusEnd}
            moveFocusAfter={moveFocusAfter}
          />
        </ListItem>)
      }
    </div>
  )
}

export function TextNodeBulletButton({ isLink, hasContent, isExpanded, isTagged, disabled, bulletClicked }: {
  isLink: boolean,
  hasContent: boolean,
  isExpanded: boolean,
  isTagged: boolean,
  disabled?: boolean,
  bulletClicked: (e: MouseEvent<HTMLButtonElement>) => void,
}) {
  const documentRef = useRef(document)
  const [isHovering, setIsHovering] = useState(false)
  const [isModKeyPressed, setIsModKeyPressed] = useState(false)

  const handleKeyDown = (e: globalThis.KeyboardEvent) => {
    const isModKey = modKey(e)
    setIsModKeyPressed(isModKey)
  }

  const handleKeyUp = (e: globalThis.KeyboardEvent) => {
    if (!modKey(e)) {
      setIsModKeyPressed(false)
    }
  }

  useEventListener('keydown', handleKeyDown, documentRef)
  useEventListener('keyup', handleKeyUp, documentRef)

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const toggleButtonClasses = classNames(
    'mt-1 size-4 shrink-0 grid place-content-center rounded-full cursor-pointer',
    isTagged ? 'text-accent-foreground' : 'text-accent-foreground/50',
    'hover:bg-accent hover:text-accent-foreground',
    { 'outline -outline-offset-1 outline-dashed outline-current/80': isLink },
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isHovering && isModKeyPressed
        ? <FullscreenIcon size={16}/>
        : (hasContent
          ? <ChevronRight size={16} className={chevronIconClasses}/>
          : <div className={'size-1.5 rounded-full bg-current/80'}/>)
      }
    </button>
  )
}
