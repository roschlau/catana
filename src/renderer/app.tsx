import {createRoot} from 'react-dom/client'
import {Node} from '../common/ipc-model'
import {Button, Flex, Heading, Theme, ThemePanel} from '@radix-ui/themes'

window.nodesAPI.openNode().then(node => {
  console.log('Node opened', node)
  const root = createRoot(document.body)
  root.render(
    <Theme>
      <App node={node}/>
      <ThemePanel/>
    </Theme>,
  )
})

function App({ node }: { node: Node }) {
  return (
    <Flex>
      <Sidebar/>
      <NodeViewer node={node}/>
    </Flex>
  )
}

function Sidebar() {
  return (
    <Flex direction={'column'}>
      <Button>Load Node...</Button>
    </Flex>
  )
}

function NodeViewer({ node }: { node: Node }) {
  return (<Flex direction={'column'} flexGrow={'1'} align={'center'}>
    <Heading>{node.title}</Heading>
    <Heading as={'h2'}>Content:</Heading>
    <ul>
      {node.content.map(text => <li key={text}>{text}</li>)}
    </ul>
    <Heading as={'h2'}>Files:</Heading>
    <ul>
      {node.fileNodes.map(path => <li key={path}>{path}</li>)}
    </ul>
  </Flex>)
}
