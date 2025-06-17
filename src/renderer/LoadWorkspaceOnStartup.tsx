import {useAppDispatch} from '@/renderer/redux/hooks'
import {useEffect} from 'react'
import {workspaceLoaded} from '@/renderer/redux/workspace-persistence'

export function LoadWorkspaceOnStartup() {
  const dispatch = useAppDispatch()
  useEffect(() => {
    window.catanaAPI.openNodeGraph('last').then(result => {
      if (!result) {
        console.warn(`Couldn't load node graph: Main process returned no result`)
        return
      }
      console.log('Graph loaded:', result.path)
      dispatch(workspaceLoaded(result))
    })
  }, [dispatch])
  return null
}
