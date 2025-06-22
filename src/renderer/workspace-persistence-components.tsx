import {useAppDispatch, useAppSelector, useAppStore} from '@/renderer/redux/hooks'
import {useCallback, useEffect, useState} from 'react'
import {
  markWorkspaceClean,
  selectWorkspaceDirty,
  serialize,
  workspaceLoaded,
} from '@/renderer/redux/workspace-persistence'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog'
import {Button} from '@/renderer/components/ui/button'
import {selectDebugMode} from '@/renderer/redux/ui/uiSlice'

export function useSaveWorkspace(): () => Promise<void> {
  const store = useAppStore()
  const dispatch = useAppDispatch()
  return useCallback(async () => {
    await window.catanaAPI.saveNodeGraph(serialize(store.getState()))
    dispatch(markWorkspaceClean())
  }, [dispatch, store])
}

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

export function SaveOnExitDialog() {
  const saveWorkspace = useSaveWorkspace()
  const isWorkspaceDirty = useAppSelector(selectWorkspaceDirty)
  const [dialogOpen, setDialogOpen] = useState(false)
  const debugMode = useAppSelector(selectDebugMode)

  useEffect(() => {
    if (debugMode) {
      if (isWorkspaceDirty) {
        console.debug('Debug mode enabled, not registering onbeforeunload listener')
      }
      window.onbeforeunload = null
      return
    }
    window.onbeforeunload = (e) => {
      if (isWorkspaceDirty) {
        setDialogOpen(true)
        e.preventDefault()
      }
    }
    return () => {
      window.onbeforeunload = null
    }
  }, [isWorkspaceDirty, debugMode])

  const saveAndClose = async () => {
    await saveWorkspace()
    window.onbeforeunload = null
    window.close()
  }

  const discardAndClose = () => {
    window.onbeforeunload = null
    window.close()
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={e => setDialogOpen(e)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            You have unsaved changes.
          </DialogTitle>
          <DialogDescription>
            Do you want to save them before closing?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant={'default'} onClick={saveAndClose}>
            Save and Close
          </Button>
          <Button variant={'destructive'} onClick={discardAndClose}>
            Discard and Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
