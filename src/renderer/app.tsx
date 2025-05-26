import {createRoot} from 'react-dom/client'
import {Button, Flex, Theme, ThemePanel} from '@radix-ui/themes'
import {useCallback, useEffect, useState} from 'react'
import {ThemeProvider} from 'next-themes'
import {Provider} from 'react-redux'
import {store} from './redux/store'
import {DownloadIcon, GearIcon, HomeIcon, UploadIcon} from '@radix-ui/react-icons'
import {useAppDispatch, useAppStore} from './redux/hooks'
import {buildTree, ROOT_NODE} from './redux/nodes/demoGraph'
import {ActionCreators} from 'redux-undo'
import {nodeGraphLoaded} from './redux/nodes/nodesSlice'
import {Id} from '../common/nodeGraphModel'
import {NodeEditorPage} from './NodeEditorPage'

const root = createRoot(document.body)
root.render(
  <Provider store={store}>
    <ThemeProvider attribute={'class'}>
      <Theme appearance={'inherit'} style={{ display: 'grid' }}>
        <App/>
      </Theme>
    </ThemeProvider>
  </Provider>
)

function App() {
  const [nodeId, setNodeId] = useState(ROOT_NODE)
  const store = useAppStore()
  const saveWorkspace = useCallback(() => {
    console.log(JSON.stringify(buildTree(store.getState().nodes.present)))
  }, [store])
  const dispatch = useAppDispatch()
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
    <Flex direction={'row'} p={'2'} gap={'2'} align={'stretch'} style={{ background: 'var(--gray-3)' }}>
      <Sidebar
        nodeClicked={setNodeId}
        onSaveWorkspaceClicked={saveWorkspace}
        onImportClicked={importClicked}
      />
      <NodeEditorPage nodeId={nodeId}/>
    </Flex>
  )
}

function Sidebar({ nodeClicked, onSaveWorkspaceClicked, onImportClicked }: {
  nodeClicked: (nodeId: Id<'node'>) => void,
  onSaveWorkspaceClicked: () => void,
  onImportClicked: () => void,
}) {
  const [showThemePanel, setShowThemePanel] = useState(false)
  return (
    <Flex direction={'column'} gap={'2'}>
      <Button onClick={() => nodeClicked(ROOT_NODE)}>
        <HomeIcon/>
        Home
      </Button>
      <Button onClick={onSaveWorkspaceClicked} variant={'surface'}>
        <DownloadIcon/>
        Dump Graph
      </Button>
      <Button onClick={onImportClicked} variant={'surface'}>
        <UploadIcon/>
        Load Tana Export
      </Button>
      <Button
        variant={'surface'}
        onClick={() => setShowThemePanel(!showThemePanel)}
      >
        <GearIcon/>
        Theme
      </Button>
      {showThemePanel && <ThemePanel/>}
    </Flex>
  )
}
