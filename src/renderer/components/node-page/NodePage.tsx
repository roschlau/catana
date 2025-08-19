import {NodeEditor, NodeTitleEditorTextFieldRef} from '@/renderer/features/node-editor/node-editor'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {KeyboardEvent, useCallback, useMemo, useRef} from 'react'
import {EditorBlockList, EditorBlockListRef} from '@/renderer/components/node-page/EditorBlockList'
import {calculateCursorPosition} from '@/renderer/util/textarea-measuring'
import {selectDebugMode, useFocusRestore} from '@/renderer/features/ui/uiSlice'
import {EditorPageBreadcrumbs} from '@/renderer/components/node-page/EditorPageBreadcrumbs'
import {getOptionalNode} from '@/renderer/features/node-graph/helpers'
import {Id} from '@/common/nodes'
import {mergeNodeForward, splitNode} from '@/renderer/features/node-graph/split-merge-thunks'
import {PageTitle} from '@/renderer/components/ui/page-title'
import {serialize} from '@/common/node-views'
import {ObjectDebugInfo} from '@/renderer/components/object-debug-info'

export function NodePage({ nodeId }: {
  nodeId: Id<'node'>,
}) {
  const dispatch = useAppDispatch()
  const node = useAppSelector(state => getOptionalNode(state.undoable.present.nodes, nodeId))
  const debugMode = useAppSelector(selectDebugMode)
  const contentNodesList = useRef<EditorBlockListRef | null>(null)
  const titleEditorRef = useRef<NodeTitleEditorTextFieldRef | null>(null)
  const nodeView = useMemo(() => ({ nodeId }), [nodeId])

  const focusEnd = useCallback(() => {
    if (!node) return false
    titleEditorRef.current?.focus({ start: node.title.length, end: node.title.length })
    return true
  }, [titleEditorRef, node])

  useFocusRestore({ nodeId }, (selection) => {
    titleEditorRef.current?.focus(selection)
  })

  const titleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const { selectionStart, selectionEnd } = e.currentTarget
    if ((e.key === 'ArrowDown' && calculateCursorPosition(textarea).lastLine)
      || (e.key === 'ArrowRight' && selectionStart === textarea.value.length)) {
      if (node && node.content.length > 0) {
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
      if (!node || node.content.length === 0) {
        return
      }
      if (selectionStart === node.title.length && selectionEnd === selectionStart) {
        dispatch(mergeNodeForward(nodeView))
        e.preventDefault()
      }
      return
    }
  }, [node, dispatch, nodeView])

  if (!node) {
    return (
      <div className={'text-muted-foreground grow flex flex-col items-center p-5'}>
        <i>Node {nodeId} could not be found. It might have been deleted.</i>
      </div>
    )
  }

  return (
    <div className={'overflow-auto scrollbar-stable flex flex-col items-center grow p-4 gap-8 bg-background rounded-lg'}>
      <EditorPageBreadcrumbs
        node={node}
        className={'self-start sticky top-0'}
      />
      <div className={'flex flex-col gap-4 w-full max-w-[800px]'}>
        <PageTitle>
          <NodeEditor
            ref={titleEditorRef}
            nodeView={serialize(nodeView)}
            onKeyDown={titleKeyDown}
          />
        </PageTitle>
        {debugMode && <ObjectDebugInfo object={node}/>}
        <EditorBlockList
          ref={contentNodesList}
          nodes={node.content}
          parentView={nodeView}
          moveFocusBefore={focusEnd}
        />
      </div>
    </div>)
}
