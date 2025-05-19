import {createRoot} from 'react-dom/client'
import {Box, Button, Flex, Heading, Theme, ThemePanel} from '@radix-ui/themes'
import {useCallback, useEffect, useState} from 'react'
import {NodeEditorInline} from './NodeEditorInline'
import {ThemeProvider} from 'next-themes'
import {Provider} from 'react-redux'
import {store} from './redux/store'
import {DownloadIcon, GearIcon, HomeIcon} from '@radix-ui/react-icons'
import {useAppDispatch, useAppStore} from './redux/hooks'
import {buildTree, ROOT_NODE} from './redux/nodes/demoGraph'
import {ActionCreators} from 'redux-undo'

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
  const [node, setNode] = useState(ROOT_NODE)
  const store = useAppStore()
  const saveWorkspace = useCallback(() => {
    console.log(JSON.stringify(buildTree(store.getState().nodes.present)))
  }, [store])
  const dispatch = useAppDispatch()
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
        nodeClicked={setNode}
        onSaveWorkspaceClicked={saveWorkspace}
      />
      <Flex
        direction={'column'} align={'center'} flexGrow={'1'} gap={'6'} p={'4'}
        style={{ background: 'var(--gray-1)', borderRadius: 'var(--radius-5)', padding: 'var(--space-4)' }}
      >
        <Heading size={'7'}>Catana</Heading>
        <Box width={'100%'} maxWidth={'600px'}>
          <NodeEditorInline nodeId={node} viewPath={[]}/>
        </Box>
      </Flex>
    </Flex>
  )
}

function Sidebar({ nodeClicked, onSaveWorkspaceClicked }: {
  nodeClicked: (nodeId: string) => void,
  onSaveWorkspaceClicked: () => void,
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
        Save Workspace
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
