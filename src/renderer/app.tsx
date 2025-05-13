import {createRoot} from 'react-dom/client'
import {Box, Button, Flex, Heading, Theme, ThemePanel} from '@radix-ui/themes'
import {useState} from 'react'
import {NodeEditor} from './NodeEditor'
import {ThemeProvider} from 'next-themes'
import {Provider} from 'react-redux'
import {store} from './redux/store'
import {ROOT_NODE} from './redux/nodesSlice'

const root = createRoot(document.body)
root.render(
  <Provider store={store}>
    <ThemeProvider attribute={'class'}>
      <Theme appearance={'inherit'}>
        <App/>
      </Theme>
    </ThemeProvider>
  </Provider>
)

function App() {
  const [node, setNode] = useState(ROOT_NODE)
  return (
    <Flex direction={'row'} p={'4'} gap={'4'}>
      <Sidebar nodeClicked={setNode}/>
      <Flex direction={'column'} align={'center'} flexGrow={'1'} gap={'6'}>
        <Heading size={'7'}>Catana</Heading>
        <Box width={'100%'} maxWidth={'600px'}>
          <NodeEditor nodeId={node}/>
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
        Home
      </Button>
      <Button
        variant={'surface'}
        onClick={() => setShowThemePanel(!showThemePanel)}
      >
        Theme
      </Button>
      {showThemePanel && <ThemePanel/>}
    </Flex>
  )
}
