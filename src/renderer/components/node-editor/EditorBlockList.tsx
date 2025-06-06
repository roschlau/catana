import {Doc, DocViewWithParent, Node, ParentNodeView} from '@/common/nodeGraphModel'
import {indentNode, outdentNode, Selection} from '@/renderer/redux/nodes/thunks'
import {Ref, useImperativeHandle, useRef} from 'react'
import {useAppDispatch} from '@/renderer/redux/hooks'
import {twMerge} from 'tailwind-merge'
import {EditorBlock} from '@/renderer/components/node-editor/EditorBlock'

export interface EditorBlockListRef {
  focus: (mode: 'first' | 'last') => void
}

export function EditorBlockList({ className, nodes, parentView, moveFocusBefore, moveFocusAfter, outdentChild, ref }: {
  className?: string,
  nodes: Node['content'],
  parentView: ParentNodeView,
  moveFocusBefore?: () => boolean,
  moveFocusAfter?: () => boolean,
  /** Called when the user triggers the outdent action on a node within this list. */
  outdentChild?: (nodeView: DocViewWithParent<Doc>, selection: Selection) => void,
  ref?: Ref<EditorBlockListRef>,
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
  const parentId = parentView.nodeId
  if (!parentId) {
    throw new Error('NodeEditorList must have a parent node ID')
  }

  const childNodeRefs = useRef<(EditorBlockListRef | null)[]>([])
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

  const indent = (index: number, childView: DocViewWithParent<Doc>, selection: Selection) => {
    if (index === 0) {
      // Can't indent a node that's already the first within its siblings
      return
    }
    // Indent node into previous preceding sibling
    dispatch(indentNode(
      childView,
      { nodeId: nodes[index - 1].nodeId, parent: parentView },
      selection,
    ))
  }

  // Handles outdenting a child node of one of this list's nodes into this list
  const outdentChildOfChild = (index: number, nodeRef: DocViewWithParent<Doc>, selection: Selection) => {
    dispatch(outdentNode(nodeRef, parentView, index + 1, selection))
  }

  return (
    <div className={twMerge('grid p-0', className)} style={{ gridTemplateColumns: 'minmax(auto, 200px) 1fr' }}>
      {nodes.map((contentNode, i) => {
        const childView: DocViewWithParent<Doc> = { nodeId: contentNode.nodeId, parent: parentView }
        return (
          <EditorBlock
            className={'col-span-2'}
            key={contentNode.nodeId}
            nodeView={childView}
            expanded={contentNode.expanded ?? false}
            moveFocusBefore={() => focusIndex(i - 1, 'last')}
            moveFocusAfter={() => focusIndex(i + 1, 'first')}
            indent={(selection) => indent(i, childView, selection)}
            outdent={outdentChild ? (selection) => outdentChild(childView, selection) : undefined}
            outdentChild={(nodeRef, selection) => outdentChildOfChild(i, nodeRef, selection)}
            ref={el => {
              childNodeRefs.current[i] = el
            }}
          />
        )
      })}
    </div>
  )
}
