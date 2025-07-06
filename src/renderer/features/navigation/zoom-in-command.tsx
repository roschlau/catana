import {FullscreenIcon} from 'lucide-react'
import {AppCommand, CommandContext} from '@/renderer/commands/app-command'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {nodeOpened} from '@/renderer/features/navigation/navigation-slice'

export const zoomInCommand: AppCommand = {
  name: 'Zoom in on node',
  additionalSearchTerms: 'open focus',
  icon: <FullscreenIcon/>,
  shortcut: 'Alt →',
  canActivate: (context) => !!context.focus?.nodeView?.parent,
  thunkCreator: (context: CommandContext) => (dispatch: AppDispatch, _getState: () => AppState) => {
    if (!context.focus) {
      console.warn('Zoom command triggered without node in context')
      return
    }
    dispatch(nodeOpened({ nodeId: context.focus.nodeView.nodeId }))
  },
}
