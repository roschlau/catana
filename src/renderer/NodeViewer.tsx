import {Node} from '../common/ipc-model'
import {Container, Flex, Heading, Text} from '@radix-ui/themes'

export function NodeViewer({ node }: { node: Node }) {
  return (<Flex direction={'column'} flexGrow={'1'} align={'center'}>
    <Container size={'3'}>
      <Heading size={'7'}>{node.title}</Heading>
      <ul>
        {node.content.map(text => <li key={text}><Text size={'2'}>{text}</Text></li>)}
      </ul>
      <Heading as={'h2'} size={'6'}>Files</Heading>
      <ul>
        {node.fileNodes.map(path => <li key={path}><Text size={'2'}>{path}</Text></li>)}
      </ul>
    </Container>
  </Flex>)
}
