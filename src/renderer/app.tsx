import {createRoot} from 'react-dom/client'
import {Box, Button, Flex, Heading, Theme, ThemePanel} from '@radix-ui/themes'
import {useState} from 'react'
import {NodeEditorInline} from './NodeEditorInline'
import {ThemeProvider} from 'next-themes'
import {Provider} from 'react-redux'
import {store} from './redux/store'
import {ROOT_NODE} from './redux/nodesSlice'
import {GearIcon, HomeIcon} from '@radix-ui/react-icons'

const root = createRoot(document.body)
root.render(
  <Provider store={store}>
    <ThemeProvider attribute={'class'}>
      <Theme appearance={'inherit'} style={{display: 'grid'}}>
        <App/>
      </Theme>
    </ThemeProvider>
  </Provider>
)

function App() {
  const [node, setNode] = useState(ROOT_NODE)
  return (
    <Flex direction={'row'} p={'2'} gap={'2'} align={'stretch'} style={{background: "var(--gray-3)"}}>
      <Sidebar nodeClicked={setNode}/>
      <Flex
        direction={'column'} align={'center'} flexGrow={'1'} gap={'6'} p={'4'}
        style={{background: "var(--gray-1)", borderRadius: "var(--radius-5)", padding: "var(--space-4)"}}
      >
        <Heading size={'7'}>Catana</Heading>
        <Box width={'100%'} maxWidth={'600px'}>
          <NodeEditorInline nodeId={node}/>
        </Box>
      </Flex>
    </Flex>
  )
}

function Sidebar({nodeClicked}: { nodeClicked: (nodeId: string) => void }) {
  const [showThemePanel, setShowThemePanel] = useState(false)
  return (
    <Flex direction={'column'} gap={'2'}>
      <Button onClick={() => nodeClicked(ROOT_NODE)}>
        <HomeIcon/>
        Home
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
