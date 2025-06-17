import {createRoot} from 'react-dom/client'
import {useCallback, useEffect} from 'react'
import {ThemeProvider, useTheme} from 'next-themes'
import {Provider as ReduxProvider} from 'react-redux'
import {store} from '@/renderer/redux/store'
import {useAppDispatch, useAppSelector, useAppStore} from '@/renderer/redux/hooks'
import {ActionCreators} from 'redux-undo'
import {nodeGraphLoaded} from '@/renderer/redux/nodes/nodesSlice'
import {NodeEditorPage} from '@/renderer/components/node-editor/NodeEditorPage'
import {debugModeSet, nodeOpened, selectDebugMode} from '@/renderer/redux/ui/uiSlice'
import {ArrowDownToLine, ArrowUpFromLine, SunMoon} from 'lucide-react'
import {Button} from '@/renderer/components/ui/button'
import {Switch} from '@/renderer/components/ui/switch'
import {Label} from '@/renderer/components/ui/label'
import {serialize, workspaceLoaded} from '@/renderer/redux/workspace-persistence'
import {LoadWorkspaceOnStartup} from '@/renderer/LoadWorkspaceOnStartup'

const root = createRoot(document.body)
root.render(
  <ReduxProvider store={store}>
    <LoadWorkspaceOnStartup/>
    <ThemeProvider attribute={'class'}>
      <App/>
    </ThemeProvider>
  </ReduxProvider>,
)

function App() {
  const dispatch = useAppDispatch()
  const nodeId = useAppSelector((state) => state.undoable.present.ui.openedNode)

  const globalKeydown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'z') {
      dispatch(ActionCreators.undo())
    }
    if (e.ctrlKey && e.key === 'Z') {
      dispatch(ActionCreators.redo())
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
      <Sidebar/>
      <NodeEditorPage nodeId={nodeId}/>
    </div>
  )
}

function Sidebar() {
  const { resolvedTheme, setTheme } = useTheme()
  const dispatch = useAppDispatch()
  const debugMode = useAppSelector(selectDebugMode)
  const store = useAppStore()

  const saveWorkspaceClicked = useCallback(async () => {
    await window.catanaAPI.saveNodeGraph(serialize(store.getState()))
  }, [store])

  const openGraphClicked = async () => {
    const result = await window.catanaAPI.openNodeGraph('pick')
    if (!result) {
      return
    }
    console.log('Graph loaded', result)
    dispatch(workspaceLoaded(result))
  }

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
      <Button onClick={saveWorkspaceClicked} variant={'outline'}>
        <ArrowDownToLine size={16}/>
        Save Graph
      </Button>
      <Button onClick={openGraphClicked} variant={'outline'}>
        <ArrowUpFromLine size={16}/>
        Open Graph
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
