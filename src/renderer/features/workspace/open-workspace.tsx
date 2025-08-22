import {useAppDispatch} from '@/renderer/redux/hooks'
import {useEffect} from 'react'
import {workspaceLoaded} from '@/renderer/features/workspace/workspace-slice'
import {AppCommand} from '@/renderer/commands/app-command'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {FolderOpen} from 'lucide-react'
import {promptToSaveWorkspaceIfNecessary} from '@/renderer/features/workspace/save-workspace-prompt'
import {displayError} from '@/renderer/features/ui/toasts'

export const openWorkspace = (
  mode: 'last' | 'pick',
  skipSavePrompt: boolean = false,
) => async (dispatch: AppDispatch, getState: () => AppState) => {
  if (!skipSavePrompt) {
    const canceled = await promptToSaveWorkspaceIfNecessary(dispatch, getState)
    if (canceled) {
      return
    }
  }
  try {
    const result = await window.catanaAPI.openWorkspace(mode)
    if (result === 'user-canceled') {
      console.warn(`Couldn't load workspace: Main process returned no result`)
      return
    }
    console.log('Workspace loaded', result.path)
    document.title = 'Catana - ' + result.path
    dispatch(workspaceLoaded(result))
  } catch (e) {
    displayError('Workspace could not be loaded: ' + String(e), { logData: e })
  }
}

export const openWorkspaceCommand: AppCommand = {
  name: 'Open Workspace',
  icon: <FolderOpen/>,
  additionalSearchTerms: 'workspace load',
  canActivate: () => true,
  thunkCreator: () => openWorkspace('pick'),
}

export function OpenWorkspaceOnStartup() {
  const dispatch = useAppDispatch()
  useEffect(() => {
    dispatch(openWorkspace('last'))
  }, [dispatch])
  return null

}
