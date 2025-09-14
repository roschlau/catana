import {createRoot} from 'react-dom/client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {ThemeProvider, useTheme} from 'next-themes'
import {Provider as ReduxProvider} from 'react-redux'
import {store} from '@/renderer/redux/store'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {ActionCreators} from 'redux-undo'
import {NodePage} from '@/renderer/components/node-page/NodePage'
import {debugModeSet, selectDebugMode} from '@/renderer/features/ui/uiSlice'
import {CheckIcon, SearchIcon, SunMoon} from 'lucide-react'
import {Button} from '@/renderer/components/ui/button'
import {Switch} from '@/renderer/components/ui/switch'
import {Label} from '@/renderer/components/ui/label'
import {saveWorkspace} from '@/renderer/features/workspace/save-workspace'
import {CommandPrompt} from '@/renderer/commands/command-prompt'
import {CommandShortcut} from '@/renderer/components/ui/command'
import {SaveWorkspacePrompt} from '@/renderer/features/workspace/save-workspace-prompt'
import {modKey} from '@/renderer/util/keyboard'
import {navigatedBack, navigatedForward} from '@/renderer/features/navigation/navigation-slice'
import packageJson from '../../package.json' with {type: 'json'}
import {
  selectIsWorkspaceLoaded,
  selectWorkspaceDirty,
  selectWorkspacePath
} from '@/renderer/features/workspace/workspace-slice'
import {OpenWorkspaceScreen} from '@/renderer/features/workspace/open-workspace-screen'
import {OpenWorkspaceOnStartup} from '@/renderer/features/workspace/open-workspace'
import {Toaster} from '@/renderer/components/ui/sonner'
import {TooltipSimple} from '@/renderer/components/ui/tooltip'
import {GitHubIcon} from '@/renderer/components/icons/github-icon'
import {WorkspaceFileChangedPrompt} from '@/renderer/features/workspace/workspace-file-changed-prompt'
import {TagPage} from '@/renderer/components/tag-page/tag-page'
import {cn} from "@/renderer/util/tailwind";
import { useEventListener } from '@/renderer/hooks/use-event-listener'

const root = createRoot(document.body)
root.render(
  <ReduxProvider store={store}>
    <OpenWorkspaceOnStartup/>
    <ThemeProvider attribute={'class'}>
      <App/>
      <SaveWorkspacePrompt/>
      <WorkspaceFileChangedPrompt/>
      <Toaster richColors/>
    </ThemeProvider>
  </ReduxProvider>,
)

function App() {
  const dispatch = useAppDispatch()
  const currentView = useAppSelector((state) => state.undoable.present.navigation.currentView)
  const [commandPromptOpen, setCommandPromptOpen] = useState(false)

  const globalKeydown = useCallback(async (e: KeyboardEvent) => {
    if (e.key === 'z' && modKey(e)) {
      dispatch(ActionCreators.undo())
      e.preventDefault()
      return
    }
    if (e.key === 'Z' && modKey(e)) {
      dispatch(ActionCreators.redo())
      e.preventDefault()
      return
    }
    if (e.key === 'k' && modKey(e)) {
      setCommandPromptOpen(!commandPromptOpen)
      e.preventDefault()
      return
    }
    if (e.key === 's' && modKey(e)) {
      await dispatch(saveWorkspace)
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowRight' && e.altKey && modKey(e)) {
      dispatch(navigatedForward())
      e.preventDefault()
      return
    }
    if (e.key === 'ArrowLeft' && e.altKey) {
      // Ctrl not required on purpose. This is handy as the inverse action for Ctrl + Right "zooming in" on a node,
      //  since "zooming out" is equivalent a back navigation in most cases.
      dispatch(navigatedBack())
      e.preventDefault()
      return
    }
  }, [commandPromptOpen, dispatch])

  const globalMouseup = useCallback(async (e: MouseEvent) => {
    if (e.button === 3) {
      dispatch(navigatedBack())
      e.preventDefault()
      return
    }
    if (e.button === 4) {
      dispatch(navigatedForward())
      e.preventDefault()
      return
    }
  }, [dispatch])

  const docRef = useRef(document)
  useEventListener('keydown', globalKeydown, docRef)
  useEventListener('mouseup', globalMouseup, docRef)

  return (
    <div className={'h-full flex flex-col bg-sidebar'}>
      <div className={'h-full flex flex-row p-2 pb-0 gap-2 items-stretch overflow-hidden'}>
        <CommandPrompt open={commandPromptOpen} onOpenChange={setCommandPromptOpen}/>
        <Sidebar searchClicked={() => setCommandPromptOpen(true)}/>
        {!currentView && <OpenWorkspaceScreen/>}
        {currentView?.type === 'node' && <NodePage nodeId={currentView.nodeId}/>}
        {currentView?.type === 'tag' && <TagPage tagId={currentView.tagId}/>}
      </div>
      <Statusbar/>
    </div>
  )
}

function Sidebar({searchClicked}: {
  searchClicked: () => void,
}) {
  const {resolvedTheme, setTheme} = useTheme()
  const dispatch = useAppDispatch()
  const debugMode = useAppSelector(selectDebugMode)
  const workspaceLoaded = useAppSelector(selectIsWorkspaceLoaded)

  return (
    <div className={'flex flex-col gap-2'}>
      {workspaceLoaded && <Button onClick={searchClicked}>
        <SearchIcon size={16}/>
        Search
        <CommandShortcut>Ctrl+K</CommandShortcut>
      </Button>}
      <Button
        variant={'ghost'}
        onClick={() => setTheme(() => resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        <SunMoon size={16}/>
        Toggle Theme
      </Button>
      <div className="flex items-center justify-center gap-2 p-2">
        <Switch id="debug-mode" checked={debugMode} onCheckedChange={checked => dispatch(debugModeSet(checked))}/>
        <Label htmlFor="debug-mode">Debug Mode</Label>
      </div>
    </div>
  )
}

function Statusbar() {
  const workspaceDirty = useAppSelector(selectWorkspaceDirty)
  const workspacePath = useAppSelector(selectWorkspacePath)
  return (
    <div className={'flex flex-row items-center justify-stretch'}>
      <TooltipSimple content={'See Code and Issues on GitHub'}>
        <a
          href="https://github.com/roschlau/catana" target="_blank" rel="noreferrer"
          className={'flex flex-row items-center justify-center gap-2 p-2 text-xs text-muted-foreground hover:text-foreground'}
        >
          <GitHubIcon className={'-translate-y-[1px]'}/>
          {packageJson.productName} v{packageJson.version}
        </a>
      </TooltipSimple>
      <div className={'grow flex place-content-center'}>
        <TooltipSimple
          content={workspaceDirty ? 'There are unsaved changes. Press Ctrl+S to save.' : 'All changes saved'}
        >
          <div className={'flex flex-row items-center justify-center gap-1 p-2 text-xs text-muted-foreground cursor-default'}>
            {workspacePath}
            <div className={cn('size-2 rounded-full', workspaceDirty ? 'bg-current' : 'bg-transparent')}></div>
          </div>
        </TooltipSimple>
      </div>
    </div>
  )
}
