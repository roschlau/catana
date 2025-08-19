import {NodeViewWithParent} from '@/common/node-views'
import {useAppSelector} from '@/renderer/redux/hooks'
import {getNode} from '@/renderer/features/node-graph/helpers'
import {ListItem} from '@/renderer/components/ui/list-item'
import {RectangleEllipsis} from 'lucide-react'
import {twMerge} from 'tailwind-merge'
import {Field} from '@/common/nodes'

export function FieldBlock({ className, nodeView }: {
  className?: string,
  /** The node view to render */
  nodeView: NodeViewWithParent<Field>,
}) {
  const field = useAppSelector(state => getNode(state.undoable.present.nodes, nodeView.nodeId))
  return (
    <ListItem className={twMerge('mr-2', className)}>
      <RectangleEllipsis className={'mt-[3px]'} size={16}/>
      <div>{field.title}</div>
    </ListItem>
  )
}
