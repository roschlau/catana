import {deserialize, NodeViewWithParent, SerializedNodeViewWithParent} from '@/common/node-views'
import React, {Ref, useMemo} from 'react'
import {NodeEditorRef, TextNodeBlock} from '@/renderer/components/node-page/TextNodeBlock'
import {useAppSelector} from '@/renderer/redux/hooks'
import {getOptionalNode} from '@/renderer/features/node-graph/helpers'
import {PropertyBlock} from '@/renderer/components/node-page/PropertyBlock'
import {FieldBlock} from '@/renderer/components/node-page/FieldBlock'
import {Field, Property, TextNode} from '@/common/nodes'
import {ListItem} from '../ui/list-item'
import {TrashIcon} from 'lucide-react'
import {twMerge} from 'tailwind-merge'

export const EditorBlock = React.memo(function EditorBlock({
  className,
  nodeView,
  expanded,
  moveFocusBefore,
  moveFocusAfter,
  ref,
}: {
  className?: string,
  /** The node view to render */
  nodeView: SerializedNodeViewWithParent,
  expanded: boolean,
  /** Called when the user attempts to move focus out of and before this node.
   Should return false if there is no previous node to move focus to, true otherwise. */
  moveFocusBefore?: () => boolean,
  /** Called when the user attempts to move focus out of and after this node.
   Should return false if there is no next node to move focus to, true otherwise. */
  moveFocusAfter?: () => boolean,
  ref?: Ref<NodeEditorRef>,
}) {
  const nv = useMemo(() => deserialize(nodeView), [nodeView])
  const node = useAppSelector(state => getOptionalNode(state.undoable.present.nodes, nv.nodeId))
  if (!node) {
    return (
      <ListItem>
        <div className="size-4 grid place-content-center rounded-full text-foreground/50 mt-1">
          <TrashIcon size={16}/>
        </div>
        <div className={twMerge('text-muted-foreground', className)}><i>Deleted Node ({nv.nodeId})</i></div>
      </ListItem>
    )
  }
  switch (node.type) {
    case 'node':
      return <TextNodeBlock
        className={className}
        nodeView={nv as NodeViewWithParent<TextNode>}
        expanded={expanded}
        moveFocusBefore={moveFocusBefore}
        moveFocusAfter={moveFocusAfter}
        ref={ref}
      />
    case 'property':
      return <PropertyBlock
        className={className}
        nodeView={nv as NodeViewWithParent<Property>}
        moveFocusBefore={moveFocusBefore}
        moveFocusAfter={moveFocusAfter}
        ref={ref}
      />
    case 'field':
      return <FieldBlock
        className={className}
        nodeView={nv as NodeViewWithParent<Field>}
      />
  }
})
