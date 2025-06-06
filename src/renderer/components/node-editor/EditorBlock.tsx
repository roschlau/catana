import {Id, NodeViewWithParent} from '@/common/nodeGraphModel'
import {Selection} from '@/renderer/redux/nodes/thunks'
import {Ref} from 'react'
import {NodeBlock, NodeEditorRef} from '@/renderer/components/node-editor/NodeBlock'
import {useAppSelector} from '@/renderer/redux/hooks'
import {getDoc} from '@/renderer/redux/nodes/helpers'
import {PropertyBlock} from '@/renderer/components/node-editor/PropertyBlock'
import {FieldBlock} from '@/renderer/components/node-editor/FieldBlock'

export function EditorBlock({
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
  nodeView: NodeViewWithParent & { nodeId: Id<'node' | 'property' | 'field'> },
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
  outdentChild?: (nodeRef: NodeViewWithParent, selection: Selection) => void,
  ref?: Ref<NodeEditorRef>,
}) {
  const node = useAppSelector(state => getDoc(state.undoable.present.nodes, nodeView.nodeId))
  switch (node.type) {
    case 'node':
      return <NodeBlock
        className={className}
        nodeView={{ ...nodeView, nodeId: node.id }}
        expanded={expanded}
        moveFocusBefore={moveFocusBefore}
        moveFocusAfter={moveFocusAfter}
        indent={indent}
        outdent={outdent}
        outdentChild={outdentChild}
        ref={ref}
      />
    case 'property':
      return <PropertyBlock
        className={className}
        nodeView={{ ...nodeView, nodeId: node.id }}
        moveFocusBefore={moveFocusBefore}
        moveFocusAfter={moveFocusAfter}
        ref={ref}
      />
    case 'field':
      return <FieldBlock
        className={className}
        nodeView={{ ...nodeView, nodeId: node.id }}
      />
  }
}
