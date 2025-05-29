import {Id} from '@/common/nodeGraphModel'
import {Heading} from '@radix-ui/themes'
import {NodeTitleEditorTextField, NodeTitleEditorTextFieldRef} from './NodeTitleEditorTextField'
import {useAppDispatch, useAppSelector} from './redux/hooks'
import {KeyboardEvent, useCallback, useRef} from 'react'
import {NodeEditorList, NodeEditorListRef} from './NodeEditorList'
import {calculateCursorPosition} from './util/textarea-measuring'
import {mergeNodeForward, splitNode} from './redux/nodes/thunks'
import {useFocusRestore} from './redux/ui/uiSlice'
import {EditorPageBreadcrumbs} from '@/renderer/EditorPageBreadcrumbs'

export function NodeEditorPage({ nodeId }: {
  nodeId: Id<'node'>,
}) {
  const dispatch = useAppDispatch()
  const node = useAppSelector(state => state.undoable.present.nodes[nodeId]!)
  const contentNodesList = useRef<NodeEditorListRef | null>(null)
  const titleEditorRef = useRef<NodeTitleEditorTextFieldRef | null>(null)
  const nodeView = { nodeId }

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
        nodeView,
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
        dispatch(mergeNodeForward(nodeView))
        e.preventDefault()
      }
      return
    }
  }

  return (
    <div className={'overflow-auto scrollbar-stable flex flex-col items-center grow p-4 gap-8 bg-card rounded-lg'}>
      <EditorPageBreadcrumbs
        node={node}
        className={'self-start'}
      />
      <div className={'flex flex-col w-full max-w-[600px]'}>
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
          parentView={nodeView}
          moveFocusBefore={focus}
        />
      </div>
    </div>)
}
