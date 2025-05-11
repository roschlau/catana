import {Container, Flex} from '@radix-ui/themes'
import {useAppDispatch, useAppSelector} from './redux/hooks'
import {selectContentNodeIds, selectNode, titleUpdated} from './redux/nodesSlice'
import TextareaAutosize from 'react-textarea-autosize'

export function NodeViewer({ nodeId }: { nodeId: string }) {
  const dispatch = useAppDispatch()
  const node = useAppSelector(selectNode(nodeId))
  const content = useAppSelector(selectContentNodeIds(nodeId))

  return (
    <Flex direction={'column'} flexGrow={'1'} align={'center'}>
      <Container size={'3'}>
        <TextareaAutosize
          value={node.title}
          onChange={e => dispatch(titleUpdated({ nodeId, title: e.target.value }))}
        />
        <ul>
          {content.map(contentNodeId => <li key={contentNodeId}>
            <NodeViewer nodeId={contentNodeId}/>
          </li>)}
        </ul>
      </Container>
    </Flex>
  )
}
