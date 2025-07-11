import {NodeViewWithParent} from '@/common/node-views'
import {Ref, useImperativeHandle, useRef} from 'react'
import {NodeEditorRef} from '@/renderer/components/node-editor/TextNodeBlock'
import {useAppSelector} from '@/renderer/redux/hooks'
import {getNode} from '@/renderer/features/node-graph/helpers'
import {ListItem} from '@/renderer/components/ui/list-item'
import {RectangleEllipsis} from 'lucide-react'
import {EditorBlockList, EditorBlockListRef} from '@/renderer/components/node-editor/EditorBlockList'
import {twMerge} from 'tailwind-merge'
import {Property} from '@/common/nodes'

export function PropertyBlock({ className, nodeView, moveFocusBefore, moveFocusAfter, ref }: {
  className?: string,
  /** The node view to render */
  nodeView: NodeViewWithParent<Property>,
  /** Called when the user attempts to move focus out of and before this node.
   Should return false if there is no previous node to move focus to, true otherwise. */
  moveFocusBefore?: () => boolean,
  /** Called when the user attempts to move focus out of and after this node.
   Should return false if there is no next node to move focus to, true otherwise. */
  moveFocusAfter?: () => boolean,
  ref?: Ref<NodeEditorRef>,
}) {
  const property = useAppSelector(state => getNode(state.undoable.present.nodes, nodeView.nodeId))
  const field = useAppSelector(state => getNode(state.undoable.present.nodes, property.fieldId))

  const contentNodesList = useRef<EditorBlockListRef | null>(null)
  useImperativeHandle(ref, () => ({
    focus: (mode: 'first' | 'last') => {
      contentNodesList.current?.focus(mode)
    },
  }))

  return (
    <div className={twMerge('w-full items-start text-muted-foreground contents', className)}>
      <ListItem className={'mr-2'}>
        <RectangleEllipsis className={'mt-[3px]'} size={16}/>
        <div>{field.title}</div>
      </ListItem>
      <EditorBlockList
        ref={contentNodesList}
        className={'grow'}
        nodes={property.content}
        parentView={nodeView}
        moveFocusBefore={moveFocusBefore}
        moveFocusAfter={moveFocusAfter}
      />
    </div>)
}
