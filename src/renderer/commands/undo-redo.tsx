import {AppCommand} from '@/renderer/commands/app-command'
import {ArrowBigUp, RedoIcon, UndoIcon} from 'lucide-react'
import {ActionCreators} from 'redux-undo'

export const undoCommand: AppCommand = {
  name: 'Undo',
  icon: <UndoIcon/>,
  shortcut: ['Ctrl', 'Z'],
  canActivate: () => true,
  thunkCreator: () => (dispatch) => dispatch(ActionCreators.undo()),
}

export const redoCommand: AppCommand = {
  name: 'Redo',
  icon: <RedoIcon/>,
  shortcut: ['Ctrl', <ArrowBigUp/>, 'Z'],
  canActivate: () => true,
  thunkCreator: () => (dispatch) => dispatch(ActionCreators.redo()),
}
