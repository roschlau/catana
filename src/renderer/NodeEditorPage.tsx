import {NodeId} from '../common/nodeGraphModel'
import {Flex, Heading} from '@radix-ui/themes'
import {NodeTitleEditorTextField, NodeTitleEditorTextFieldRef} from './NodeTitleEditorTextField'
import {useAppDispatch, useAppSelector} from './redux/hooks'
import {KeyboardEvent, useCallback, useRef} from 'react'
import {NodeEditorList, NodeEditorListRef} from './NodeEditorList'
import {calculateCursorPosition} from './util/textarea-measuring'
import {mergeNode, splitNode} from './redux/nodes/thunks'
import {useFocusRestore} from './redux/ui/uiSlice'

export function NodeEditorPage({ nodeId }: {
  nodeId: NodeId,
}) {
  const dispatch = useAppDispatch()
  const node = useAppSelector(state => state.nodes.present[nodeId]!)
  const contentNodesList = useRef<NodeEditorListRef | null>(null)
  const titleEditorRef = useRef<NodeTitleEditorTextFieldRef | null>(null)
  const viewPath = [nodeId]

  const focus = useCallback(() => {
    titleEditorRef.current?.focus()
    return true
  }, [titleEditorRef])

  useFocusRestore({ nodeId }, (selection) => {
    titleEditorRef.current?.focus(selection)
  })

  const titleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const { selectionStart, selectionEnd } = e.currentTarget
    if ((e.key === 'ArrowDown' && calculateCursorPosition(textarea).lastLine)
      || (e.key === 'ArrowRight' && selectionStart === textarea.value.length)) {
      if (node.content.length > 0) {
        contentNodesList.current?.focus('first')
        e.preventDefault()
      }
      return
    }
    if (e.key === 'Enter') {
      // Not allowing any line breaks for now to simplify things. Might change my mind on that later.
      e.preventDefault()
      dispatch(splitNode(
        { nodeId },
        selectionStart,
        selectionEnd,
      ))
      return
    }
    if (e.key === 'Delete') {
      if (node.content.length === 0) {
        return
      }
      if (selectionStart === node.title.length && selectionEnd === selectionStart) {
        dispatch(mergeNode({ nodeId }, viewPath, 'next'))
        e.preventDefault()
      }
      return
    }
  }

  return (
    <Flex
      direction={'column'} align={'center'} flexGrow={'1'} p={'6'}
      style={{ background: 'var(--gray-1)', borderRadius: 'var(--radius-5)' }}
    >
      <Flex direction={'column'} width={'100%'} maxWidth={'600px'}>
        <Heading size={'7'} weight={'medium'}>
          <NodeTitleEditorTextField
            ref={titleEditorRef}
            node={node}
            keyDown={titleKeyDown}
          />
        </Heading>
        <NodeEditorList
          ref={contentNodesList}
          nodes={node.content}
          viewPath={viewPath}
          moveFocusBefore={focus}
        />
      </Flex>
    </Flex>)
}
