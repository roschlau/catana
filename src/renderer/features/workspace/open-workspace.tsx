import {useAppDispatch} from '@/renderer/redux/hooks'
import {useEffect} from 'react'
import {workspaceLoaded} from '@/renderer/features/workspace/workspace-slice'
import {AppCommand} from '@/renderer/commands/app-command'
import {AppDispatch, AppState} from '@/renderer/redux/store'
import {FolderOpen} from 'lucide-react'
import {promptToSaveWorkspaceIfNecessary} from '@/renderer/features/workspace/save-workspace-prompt'

export const openWorkspace = (mode: 'last' | 'pick') => async (dispatch: AppDispatch, getState: () => AppState) => {
  const canceled = await promptToSaveWorkspaceIfNecessary(dispatch, getState)
  if (canceled) {
    return
  }
  const result = await window.catanaAPI.openWorkspace(mode)
  if (!result) {
    console.warn(`Couldn't load workspace: Main process returned no result`)
    return
  }
  console.log('Workspace loaded', result.path)
  document.title = 'Catana - ' + result.path
  dispatch(workspaceLoaded(result))
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
