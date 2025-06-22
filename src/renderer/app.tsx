import {createRoot} from 'react-dom/client'
import {useCallback, useEffect, useState} from 'react'
import {ThemeProvider, useTheme} from 'next-themes'
import {Provider as ReduxProvider} from 'react-redux'
import {store} from '@/renderer/redux/store'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {ActionCreators} from 'redux-undo'
import {nodeGraphLoaded} from '@/renderer/redux/nodes/nodesSlice'
import {NodeEditorPage} from '@/renderer/components/node-editor/NodeEditorPage'
import {debugModeSet, nodeOpened, selectDebugMode} from '@/renderer/redux/ui/uiSlice'
import {ArrowUpFromLine, SearchIcon, SunMoon} from 'lucide-react'
import {Button} from '@/renderer/components/ui/button'
import {Switch} from '@/renderer/components/ui/switch'
import {Label} from '@/renderer/components/ui/label'
import {saveWorkspace} from '@/renderer/persistence/save-workspace'
import {CommandPrompt} from '@/renderer/commands/command-prompt'
import {CommandShortcut} from '@/renderer/components/ui/command'
import {SaveOnExitDialog} from '@/renderer/persistence/save-on-exit-dialog'
import {OpenWorkspaceOnStartup} from '@/renderer/persistence/open-workspace'

const root = createRoot(document.body)
root.render(
  <ReduxProvider store={store}>
    <OpenWorkspaceOnStartup/>
    <SaveOnExitDialog/>
    <ThemeProvider attribute={'class'}>
      <App/>
    </ThemeProvider>
  </ReduxProvider>,
)

function App() {
  const dispatch = useAppDispatch()
  const nodeId = useAppSelector((state) => state.undoable.present.ui.openedNode)
  const [commandPromptOpen, setCommandPromptOpen] = useState(false)

  const globalKeydown = useCallback(async (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'z') {
      dispatch(ActionCreators.undo())
    }
    if (e.ctrlKey && e.key === 'Z') {
      dispatch(ActionCreators.redo())
    }
    if (e.key === 'k' && e.ctrlKey) {
      setCommandPromptOpen(!commandPromptOpen)
    }
    if (e.key === 's' && e.ctrlKey) {
      await dispatch(saveWorkspace)
    }
  }, [dispatch])

  useEffect(() => {
    document.addEventListener('keydown', globalKeydown)
    return () => {
      document.removeEventListener('keydown', globalKeydown)
    }
  }, [globalKeydown])

  return (
    <div className={'h-full flex flex-row p-2 gap-2 items-stretch bg-muted overflow-hidden'}>
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

  const importClicked = async () => {
    const result = await window.catanaAPI.loadTanaExport()
    if (!result) {
      return
    }
    const { rootId, nodes } = result
    dispatch(nodeGraphLoaded(nodes))
    dispatch(nodeOpened({ nodeId: rootId }))
  }

  return (
    <div className={'flex flex-col gap-2'}>
      <Button onClick={searchClicked}>
        <SearchIcon size={16}/>
        Search
        <CommandShortcut>Ctrl+K</CommandShortcut>
      </Button>
      <Button onClick={importClicked} variant={'outline'}>
        <ArrowUpFromLine size={16}/>
        Load Tana Export
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
