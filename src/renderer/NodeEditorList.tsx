import {Node, NodeId, NodeReference} from '../common/nodeGraphModel'
import {indentNode, outdentNode, Selection} from './redux/nodes/thunks'
import {Ref, useImperativeHandle, useRef} from 'react'
import {useAppDispatch} from './redux/hooks'
import {NodeEditorInline} from './NodeEditorInline'

export interface NodeEditorListRef {
  focus: (mode: 'first' | 'last') => void
}

export function NodeEditorList({ nodes, viewPath, moveFocusBefore, moveFocusAfter, outdentChild, ref }: {
  nodes: Node['content'],
  viewPath: NodeId[],
  moveFocusBefore?: () => boolean,
  moveFocusAfter?: () => boolean,
  /** Called when the user triggers the outdent action on a node within this list. */
  outdentChild?: (nodeRef: NodeReference, selection: Selection) => void,
  ref?: Ref<NodeEditorListRef>,
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

  const childNodeRefs = useRef<(NodeEditorListRef | null)[]>([])
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
      paddingInlineStart: '0',
      width: '100%',
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
