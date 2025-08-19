import {ArrowLeft, ArrowRight, FullscreenIcon} from 'lucide-react'
import {AppCommand, CommandContext} from '@/renderer/commands/app-command'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {navigatedBack, navigatedForward, viewOpened} from '@/renderer/features/navigation/navigation-slice'

export const zoomInCommand: AppCommand = {
  name: 'Zoom in on node',
  additionalSearchTerms: 'open focus',
  icon: <FullscreenIcon/>,
  shortcut: ['Alt', <ArrowRight/>],
  canActivate: (context) => !!context.focus?.nodeView?.parent,
  thunkCreator: (context: CommandContext) => (dispatch: AppDispatch, _getState: () => AppState) => {
    if (!context.focus) {
      console.warn('Zoom command triggered without node in context')
      return
    }
    dispatch(viewOpened({ type: 'node', nodeId: context.focus.nodeView.nodeId }))
  },
}

export const backCommand: AppCommand = {
  name: 'Back',
  icon: <ArrowLeft/>,
  shortcut: ['Ctrl', 'Alt', <ArrowLeft/>],
  canActivate: () => true,
  thunkCreator: () => (dispatch) => {
    dispatch(navigatedBack())
  }
}

export const forwardCommand: AppCommand = {
  name: 'Forward',
  icon: <ArrowRight/>,
  shortcut: ['Ctrl', 'Alt', <ArrowRight/>],
  canActivate: () => true,
  thunkCreator: () => (dispatch) => {
    dispatch(navigatedForward())
  }
}
