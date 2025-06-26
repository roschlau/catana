import {useAppDispatch} from '@/renderer/redux/hooks'
import {useEffect} from 'react'
import {workspaceLoaded} from '@/renderer/redux/workspace-persistence'
import {AppCommand} from '@/renderer/commands/app-command'
import {AppDispatch} from '@/renderer/redux/store'
import {FolderOpen} from 'lucide-react'

export const openWorkspace = (mode: 'last' | 'pick') => async (dispatch: AppDispatch) => {
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
