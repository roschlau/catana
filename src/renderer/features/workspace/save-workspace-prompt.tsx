import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {selectWorkspaceDirty} from '@/renderer/features/workspace/workspace-slice'
import {useEffect} from 'react'
import {saveWorkspacePromptShown, selectDebugMode, selectSaveWorkspacePromptShown} from '@/renderer/features/ui/uiSlice'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/renderer/components/ui/dialog'
import {Button} from '@/renderer/components/ui/button'
import {saveWorkspace} from '@/renderer/features/workspace/save-workspace'
import {AppDispatch, AppState} from '@/renderer/redux/store'

/**
 * Global variable as a workaround to pass a callback to the save workspace prompt, since non-serializable state can't
 * live in the redux store.
 */
let saveWorkspacePromptCallback: ((canceled: boolean) => void) | null = null

/**
 * Checks if the current workspace has unsaved changes. If it does, it prompts the user to either save or discard those
 * changes before continuing.
 *
 * @return a promise resolving to `false` if the user made a decision and the calling action should proceed
 *         or `true` if the user canceled the decision and the calling action should abort.
 */
export async function promptToSaveWorkspaceIfNecessary(
  dispatch: AppDispatch,
  getState: () => AppState,
): Promise<boolean> {
  return new Promise((resolve) => {
    const state = getState()
    if (!state.undoable.present.workspace?.workspaceDirty) {
      resolve(false)
      return
    }
    if (state.ui.saveWorkspacePromptShown) {
      throw new Error('Save workspace prompt already being shown')
    }
    if (saveWorkspacePromptCallback) {
      throw new Error('Save workspace prompt callback already set')
    }
    saveWorkspacePromptCallback = (canceled) => {
      resolve(canceled)
    }
    dispatch(saveWorkspacePromptShown(true))
  })
}

/**
 * Displays a prompt to ask the user whether they want to save their changes before taking an action that would
 * otherwise lose those changes.
 *
 * The prompt automatically registers to show up when the window is being closed.
 * External actions can additionally use it by calling {@link promptToSaveWorkspaceIfNecessary}.
 */
export function SaveWorkspacePrompt() {
  const dispatch = useAppDispatch()
  const isWorkspaceDirty = useAppSelector(selectWorkspaceDirty)
  const promptShown = useAppSelector(selectSaveWorkspacePromptShown)
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
        dispatch(promptToSaveWorkspaceIfNecessary).then(canceled => {
          if (!canceled) {
            window.onbeforeunload = null
            window.close()
          }
        })
        e.preventDefault()
      }
    }
    return () => {
      window.onbeforeunload = null
    }
  }, [isWorkspaceDirty, debugMode, dispatch])

  const saveAndClose = async () => {
    await dispatch(saveWorkspace)
    saveWorkspacePromptCallback?.(false)
    saveWorkspacePromptCallback = null
    dispatch(saveWorkspacePromptShown(false))
  }

  const discardAndClose = () => {
    saveWorkspacePromptCallback?.(false)
    saveWorkspacePromptCallback = null
    dispatch(saveWorkspacePromptShown(false))
  }

  const openChange = (open: boolean) => {
    if (!open && saveWorkspacePromptCallback) {
      saveWorkspacePromptCallback(true)
      saveWorkspacePromptCallback = null
    }
    dispatch(saveWorkspacePromptShown(open))
  }

  return (
    <Dialog open={promptShown} onOpenChange={openChange}>
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
