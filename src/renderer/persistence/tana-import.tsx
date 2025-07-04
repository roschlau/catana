import {AppCommand, CommandContext} from '@/renderer/commands/app-command'
import {ImportIcon} from 'lucide-react'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {AppDispatch} from '@/renderer/redux/store'
import {insertTrees} from '@/renderer/redux/nodes/insert-content'
import {mapIds} from '@/renderer/redux/nodes/mapIds'

export const importFromTanaCommand: AppCommand = {
  name: 'Import from Tana',
  icon: <ImportIcon/>,
  canActivate: () => true,
  thunkCreator: (context: CommandContext) => createUndoTransaction(async (dispatch: AppDispatch) => {
    const nodeView = context.focus?.nodeView ?? { nodeId: context.openedNode! }
    if (!nodeView) {
      console.warn('Import from Tana command triggered without node in context')
      return
    }
    const nodeGraph = await window.catanaAPI.loadTanaExport()
    if (!nodeGraph) {
      console.warn('Opening Tana export canceled')
      return
    }
    const { rootId, nodes } = nodeGraph
    const graph = mapIds(nodes, (id) => id === rootId ? id : 'tana_' + id)
    dispatch(insertTrees(nodeView, [{ nodes: graph, rootId }]))
  }),
}
