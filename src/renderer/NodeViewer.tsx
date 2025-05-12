import {Flex} from '@radix-ui/themes'
import {useAppDispatch, useAppSelector} from './redux/hooks'
import {selectContentNodeIds, selectNode, titleUpdated} from './redux/nodesSlice'
import TextareaAutosize from 'react-textarea-autosize'
import {ChevronRightIcon, DotFilledIcon} from '@radix-ui/react-icons'
import {KeyboardEvent, useState} from 'react'
import './NodeViewer.css'
import classNames from 'classnames'

export function NodeViewer({ nodeId, viewParentId }: { nodeId: string, viewParentId?: string }) {
  const dispatch = useAppDispatch()
  const node = useAppSelector(selectNode(nodeId))
  const content = useAppSelector(state => selectContentNodeIds(state, nodeId))
  const [expanded, setExpanded] = useState(true)

  const keyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'ArrowUp') {
      e.preventDefault()
      setExpanded(false)
    }
    if (e.ctrlKey && e.key === 'ArrowDown') {
      e.preventDefault()
      setExpanded(true)
    }
  }

  const chevronButtonClasses = classNames(
    'NodeViewer_chevron-button',
    { 'NodeViewer_chevron-button--link': viewParentId && viewParentId !== node.ownerNodeId },
  )

  return (
    <Flex direction={'column'} flexGrow={'1'} align={'center'}>
      <Flex direction={'row'} width={'100%'} gap={'1'} align={'center'}>
        <button
          className={chevronButtonClasses}
          onClick={() => setExpanded(!expanded)}
        >
          {content.length > 0
            ? <ChevronRightIcon style={{ rotate: expanded ? '90deg' : '0deg' }} color={'var(--gray-10)'}/>
            : <DotFilledIcon color={'var(--gray-10)'}/>}
        </button>
        <TextareaAutosize
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            resize: 'none',
            color: 'var(--gray-11)',
          }}
          value={node.title}
          onChange={e => dispatch(titleUpdated({ nodeId, title: e.target.value }))}
          onKeyDown={keyDown}
        />
      </Flex>
      {expanded && content.length > 0 && <ul style={{
        width: '100%',
        marginInlineStart: '12px',
        paddingInlineStart: '12px',
        borderLeft: '2px solid var(--gray-5)',
      }}>
        {content.map(contentNodeId => <li key={contentNodeId}>
          <NodeViewer nodeId={contentNodeId} viewParentId={node.id}/>
        </li>)}
      </ul>}
    </Flex>
  )
}
