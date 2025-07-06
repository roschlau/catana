import {NodeViewWithParent} from '@/common/node-views'
import {Ref} from 'react'
import {NodeEditorRef, TextNodeBlock} from '@/renderer/components/node-editor/TextNodeBlock'
import {useAppSelector} from '@/renderer/redux/hooks'
import {getOptionalNode} from '@/renderer/features/node-graph/helpers'
import {PropertyBlock} from '@/renderer/components/node-editor/PropertyBlock'
import {FieldBlock} from '@/renderer/components/node-editor/FieldBlock'
import {Node} from '@/common/nodes'
import {ListItem} from '../ui/list-item'
import {TrashIcon} from 'lucide-react'
import {twMerge} from 'tailwind-merge'

export function EditorBlock({
  className,
  nodeView,
  expanded,
  moveFocusBefore,
  moveFocusAfter,
  ref,
}: {
  className?: string,
  /** The node view to render */
  nodeView: NodeViewWithParent<Node>,
  expanded: boolean,
  /** Called when the user attempts to move focus out of and before this node.
   Should return false if there is no previous node to move focus to, true otherwise. */
  moveFocusBefore?: () => boolean,
  /** Called when the user attempts to move focus out of and after this node.
   Should return false if there is no next node to move focus to, true otherwise. */
  moveFocusAfter?: () => boolean,
  ref?: Ref<NodeEditorRef>,
}) {
  const node = useAppSelector(state => getOptionalNode(state.undoable.present.nodes, nodeView.nodeId))
  if (!node) {
    return (
      <ListItem>
        <div className="size-4 grid place-content-center rounded-full text-foreground/50 mt-1">
          <TrashIcon size={16}/>
        </div>
        <div className={twMerge('text-muted-foreground', className)}><i>Deleted Node ({nodeView.nodeId})</i></div>
      </ListItem>
    )
  }
  switch (node.type) {
    case 'node':
      return <TextNodeBlock
        className={className}
        nodeView={{ ...nodeView, nodeId: node.id }}
        expanded={expanded}
        moveFocusBefore={moveFocusBefore}
        moveFocusAfter={moveFocusAfter}
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
