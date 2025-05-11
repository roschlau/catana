import {createRoot} from 'react-dom/client'
import {Button, Flex, Heading, Theme, ThemePanel} from '@radix-ui/themes'
import {useState} from 'react'
import {NodeViewer} from './NodeViewer'
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
        <ThemePanel/>
      </Theme>
    </ThemeProvider>
  </Provider>
)

function App() {
  const [node, setNode] = useState(ROOT_NODE)
  return (
    <Flex direction={'row'} p={'4'} gap={'4'}>
      <Sidebar nodeClicked={setNode}/>
      <Flex direction={'column'} align={'center'}>
        <Heading size={'7'}>Catana</Heading>
        <NodeViewer nodeId={node}/>
      </Flex>
    </Flex>
  )
}

function Sidebar({nodeClicked}: { nodeClicked: (nodeId: string) => void }) {
  return (
    <Flex direction={'column'} gap={'2'}>
      <Button onClick={() => nodeClicked(ROOT_NODE)}>Home</Button>
    </Flex>
  )
}
