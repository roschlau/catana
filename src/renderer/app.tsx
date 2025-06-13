import {createRoot} from 'react-dom/client'
import {useCallback, useEffect} from 'react'
import {ThemeProvider, useTheme} from 'next-themes'
import {Provider as ReduxProvider} from 'react-redux'
import {store} from '@/renderer/redux/store'
import {useAppDispatch, useAppSelector, useAppStore} from '@/renderer/redux/hooks'
import {ROOT_NODE} from '@/renderer/redux/nodes/demoGraph'
import {ActionCreators} from 'redux-undo'
import {nodeGraphLoaded} from '@/renderer/redux/nodes/nodesSlice'
import {NodeEditorPage} from '@/renderer/components/node-editor/NodeEditorPage'
import {rootNodeSet} from '@/renderer/redux/ui/uiSlice'
import {ArrowDownToLine, ArrowUpFromLine, House, SunMoon} from 'lucide-react'
import {Button} from '@/renderer/components/ui/button'
import {buildTree} from '@/common/node-tree'
import {Id} from '@/common/nodes'

const root = createRoot(document.body)
root.render(
  <ReduxProvider store={store}>
    <ThemeProvider attribute={'class'}>
      <App/>
    </ThemeProvider>
  </ReduxProvider>,
)

function App() {
  const dispatch = useAppDispatch()
  const nodeId = useAppSelector((state) => state.undoable.present.ui.rootNode)
  const store = useAppStore()
  const saveWorkspace = useCallback(() => {
    console.log(JSON.stringify(buildTree(store.getState().undoable.present.nodes)))
  }, [store])
  const setNodeId = (nodeId: Id<'node'>) => { dispatch(rootNodeSet({ nodeId })) }
  const importClicked = async () => {
    const result = await window.catanaAPI.loadTanaExport()
    if (!result) {
      return
    }
    const { rootId, nodes } = result
    dispatch(nodeGraphLoaded(nodes))
    setNodeId(rootId)
  }
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
      <Sidebar
        nodeClicked={setNodeId}
        onSaveWorkspaceClicked={saveWorkspace}
        onImportClicked={importClicked}
      />
      <NodeEditorPage nodeId={nodeId}/>
    </div>
  )
}

function Sidebar({ nodeClicked, onSaveWorkspaceClicked, onImportClicked }: {
  nodeClicked: (nodeId: Id<'node'>) => void,
  onSaveWorkspaceClicked: () => void,
  onImportClicked: () => void,
}) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <div className={'flex flex-col gap-2'}>
      <Button onClick={() => nodeClicked(ROOT_NODE)}>
        <House size={16}/>
        Home
      </Button>
      <Button onClick={onSaveWorkspaceClicked} variant={'outline'}>
        <ArrowDownToLine size={16}/>
        Dump Graph
      </Button>
      <Button onClick={onImportClicked} variant={'outline'}>
        <ArrowUpFromLine size={16} />
        Load Tana Export
      </Button>
      <Button
        variant={'ghost'}
        onClick={() => setTheme(() => resolvedTheme === 'dark' ? 'light' : 'dark')}
      >
        <SunMoon size={16} />
        Toggle Theme
      </Button>
    </div>
  )
}
