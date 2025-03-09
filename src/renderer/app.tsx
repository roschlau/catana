import {createRoot} from 'react-dom/client'
import {Node} from '../common/ipc-model'
import {Button, Flex, Text, Theme, ThemePanel} from '@radix-ui/themes'
import {useState} from 'react'
import {NodeViewer} from './NodeViewer'

const root = createRoot(document.body)
root.render(
  <Theme>
    <App/>
    <ThemePanel/>
  </Theme>,
)

function App() {
  const [node, setNode] = useState(null as null | Node)
  async function loadNode(mode: 'openDirectory' | 'openFile') {
    const newNode = await window.nodesAPI.openNode(mode)
    if (newNode) {
      setNode(newNode)
    }
  }
  return (
    <Flex direction={'row'} p={'4'} gap={'4'}>
      <Sidebar loadNodeClicked={loadNode}/>
      {node ? <NodeViewer node={node}/> : <WelcomeScreen/>}
    </Flex>
  )
}

function Sidebar({loadNodeClicked}: { loadNodeClicked: (mode: 'openDirectory' | 'openFile') => void }) {
  return (
    <Flex direction={'column'} gap={'2'}>
      <Button onClick={() => loadNodeClicked('openFile')}>Open File</Button>
      <Button onClick={() => loadNodeClicked('openDirectory')}>Open Directory</Button>
    </Flex>
  )
}

function WelcomeScreen() {
  return (<Text>Welcome!</Text>)
}
