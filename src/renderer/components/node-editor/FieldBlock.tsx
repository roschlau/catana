import {Id, NodeViewWithParent} from '@/common/nodeGraphModel'
import {useAppSelector} from '@/renderer/redux/hooks'
import {getNode} from '@/renderer/redux/nodes/helpers'
import {ListItem} from '@/renderer/components/ui/list-item'
import {RectangleEllipsis} from 'lucide-react'
import {twMerge} from 'tailwind-merge'

export function FieldBlock({ className, nodeView }: {
  className?: string,
  /** The node view to render */
  nodeView: NodeViewWithParent & { nodeId: Id<'field'> },
}) {
  const field = useAppSelector(state => getNode(state.undoable.present.nodes, nodeView.nodeId))
  return (
    <ListItem className={twMerge('mr-2', className)}>
      <RectangleEllipsis className={'mt-[3px]'} size={16}/>
      <div>{field.title}</div>
    </ListItem>
  )
}
