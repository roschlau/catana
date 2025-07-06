import {createRoot} from 'react-dom/client'
import {useCallback, useEffect, useState} from 'react'
import {ThemeProvider, useTheme} from 'next-themes'
import {Provider as ReduxProvider} from 'react-redux'
import {store} from '@/renderer/redux/store'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {ActionCreators} from 'redux-undo'
import {NodeEditorPage} from '@/renderer/components/node-editor/NodeEditorPage'
import {debugModeSet, selectDebugMode} from '@/renderer/redux/ui/uiSlice'
import {SearchIcon, SunMoon} from 'lucide-react'
import {Button} from '@/renderer/components/ui/button'
import {Switch} from '@/renderer/components/ui/switch'
import {Label} from '@/renderer/components/ui/label'
import {saveWorkspace} from '@/renderer/persistence/save-workspace'
import {CommandPrompt} from '@/renderer/commands/command-prompt'
import {CommandShortcut} from '@/renderer/components/ui/command'
import {SaveWorkspacePrompt} from '@/renderer/persistence/save-workspace-prompt'
import {OpenWorkspaceOnStartup} from '@/renderer/persistence/open-workspace'
import {modKey} from '@/renderer/util/keyboard'
import {navigatedBack, navigatedForward} from '@/renderer/features/navigation/navigation-slice'

const root = createRoot(document.body)
root.render(
  <ReduxProvider store={store}>
    <OpenWorkspaceOnStartup/>
    <SaveWorkspacePrompt/>
    <ThemeProvider attribute={'class'}>
      <App/>
    </ThemeProvider>
  </ReduxProvider>,
)

function App() {
  const dispatch = useAppDispatch()
  const nodeId = useAppSelector((state) => state.undoable.present.navigation.openedNode)
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

  useEffect(() => {
    document.addEventListener('keydown', globalKeydown)
    document.addEventListener('mouseup', globalMouseup)
    return () => {
      document.removeEventListener('keydown', globalKeydown)
      document.removeEventListener('mouseup', globalMouseup)
    }
  }, [globalKeydown, globalMouseup])

  return (
    <div className={'h-full flex flex-row p-2 gap-2 items-stretch bg-sidebar overflow-hidden'}>
      <CommandPrompt open={commandPromptOpen} onOpenChange={setCommandPromptOpen}/>
      <Sidebar searchClicked={() => setCommandPromptOpen(true)}/>
      {nodeId && <NodeEditorPage nodeId={nodeId}/>}
    </div>
  )
}

function Sidebar({ searchClicked }: {
  searchClicked: () => void,
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const dispatch = useAppDispatch()
  const debugMode = useAppSelector(selectDebugMode)

  return (
    <div className={'flex flex-col gap-2'}>
      <Button onClick={searchClicked}>
        <SearchIcon size={16}/>
        Search
        <CommandShortcut>Ctrl+K</CommandShortcut>
      </Button>
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
