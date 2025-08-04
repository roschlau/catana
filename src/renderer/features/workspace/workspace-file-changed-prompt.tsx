import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {selectWorkspaceDirty} from '@/renderer/features/workspace/workspace-slice'
import {useCallback, useEffect, useState} from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/renderer/components/ui/alert-dialog'
import {openWorkspace} from '@/renderer/features/workspace/open-workspace'
import {ArrowRightIcon, FolderSyncIcon, TriangleAlertIcon} from 'lucide-react'
import {toast} from 'sonner'

export function WorkspaceFileChangedPrompt() {
  const dispatch = useAppDispatch()
  const [promptShown, setPromptShown] = useState(false)
  const workspaceDirty = useAppSelector(selectWorkspaceDirty)

  const discardAndReload = useCallback(async () => {
    dispatch(openWorkspace('last', true))
    setPromptShown(false)
    toast.success('Workspace Reloaded')
  }, [dispatch, setPromptShown])

  const keepChangesClicked = useCallback(async () => {
    setPromptShown(false)
  }, [setPromptShown])

  useEffect(() => {
    const removeListener = window.catanaAPI.onWorkspaceFileChangedExternally(() => {
      if (!workspaceDirty) {
        dispatch(openWorkspace('last', true))
        toast.success('Workspace reloaded due to external changes')
      } else {
        setPromptShown(true)
      }
    })
    return () => {
      removeListener()
    }
  }, [dispatch, workspaceDirty, setPromptShown])

  return (
    <AlertDialog open={promptShown}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <TriangleAlertIcon/>
            Workspace file modified externally
          </AlertDialogTitle>
          <AlertDialogDescription>
            Another program has modified the currently loaded workspace file.
            Please decide whether to keep your changes, or discard them and reload the workspace from the changed file.
            If you keep your changes, the next time you save will overwrite the external changes to the file.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={discardAndReload}>
            <FolderSyncIcon/>
            Reload from Disk
          </AlertDialogAction>
          <AlertDialogAction onClick={keepChangesClicked}>
            <ArrowRightIcon/>
            Keep Changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
