import {NodeView, NodeViewWithParent, serialize} from '@/common/node-views'
import React, {Ref, useCallback, useImperativeHandle, useMemo, useRef} from 'react'
import {twMerge} from 'tailwind-merge'
import {EditorBlock} from '@/renderer/components/node-editor/EditorBlock'
import {Node, ParentNode, TextNode} from '@/common/nodes'
import {NodeEditorRef} from '@/renderer/components/node-editor/TextNodeBlock'

export interface EditorBlockListRef {
  focus: (mode: 'first' | 'last') => void
}

export const EditorBlockList = React.memo(function EditorBlockList({
  className,
  nodes,
  parentView,
  moveFocusBefore,
  moveFocusAfter,
  ref,
}: {
  className?: string,
  nodes: TextNode['content'],
  parentView: NodeView<ParentNode>,
  moveFocusBefore?: () => boolean,
  moveFocusAfter?: () => boolean,
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
  const parentId = parentView.nodeId
  if (!parentId) {
    throw new Error('NodeEditorList must have a parent node ID')
  }

  const childNodeRefs = useRef<(EditorBlockListRef | null)[]>([])
  if (childNodeRefs.current.length !== nodes.length) {
    childNodeRefs.current = Array(nodes.length).fill(null)
  }

  const focusIndex = useCallback((index: number, mode: 'first' | 'last') => {
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
  }, [moveFocusAfter, moveFocusBefore, nodes.length])

  // Pre-generate and memoize callback functions
  const callbacks = useMemo(() =>
    new Array(nodes.length).fill(null).map((_, i) => ({
      moveFocusBefore: () => focusIndex(i - 1, 'last'),
      moveFocusAfter: () => focusIndex(i + 1, 'first'),
      ref: (el: NodeEditorRef | null) => {
        childNodeRefs.current[i] = el
      },
    })), [focusIndex, nodes.length])


  return (
    <div className={twMerge('grid p-0', className)} style={{ gridTemplateColumns: 'minmax(auto, 200px) 1fr' }}>
      {nodes.map((contentNode, i) => {
        const childView: NodeViewWithParent<Node> = { nodeId: contentNode.nodeId, parent: parentView }
        return (
          <EditorBlock
            className={'col-span-2'}
            key={contentNode.nodeId}
            nodeView={serialize(childView)}
            expanded={contentNode.expanded ?? false}
            moveFocusBefore={callbacks[i].moveFocusBefore}
            moveFocusAfter={callbacks[i].moveFocusAfter}
            ref={callbacks[i].ref}
          />
        )
      })}
    </div>
  )
})
