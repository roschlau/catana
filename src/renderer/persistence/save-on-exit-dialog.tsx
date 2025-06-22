import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {selectWorkspaceDirty} from '@/renderer/redux/workspace-persistence'
import {useEffect, useState} from 'react'
import {selectDebugMode} from '@/renderer/redux/ui/uiSlice'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog'
import {Button} from '@/renderer/components/ui/button'
import {saveWorkspace} from '@/renderer/persistence/save-workspace'

export function SaveOnExitDialog() {
  const dispatch = useAppDispatch()
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
    await dispatch(saveWorkspace)
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
