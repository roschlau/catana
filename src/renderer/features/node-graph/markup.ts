import {Selection} from '@/renderer/util/selection'
import {TextNode} from '@/common/nodes'
import {AppDispatch} from '@/renderer/redux/store'
import {markRange} from '@/common/markdown-utils'
import {titleUpdated} from '@/renderer/features/node-graph/nodesSlice'
import {focusRestoreRequested} from '@/renderer/features/ui/uiSlice'
import {NodeView} from '@/common/node-views'

export function encloseRangeThunk(
  node: TextNode,
  nodeView: NodeView<TextNode>,
  range: Selection,
  mode: 'toggle' | 'enclose',
  prefix: string,
  suffix: string = prefix,
) {
  return (dispatch: AppDispatch) => {
    const { result: newTitle, mappedRange } = markRange(node.title, range, mode, prefix, suffix)
    dispatch(titleUpdated({ nodeId: node.id, title: newTitle }))
    dispatch(focusRestoreRequested({
      nodeView,
      selection: mappedRange,
    }))
  }
}
