import {
  NodeTitleEditorTextField,
  NodeTitleEditorTextFieldRef,
} from '@/renderer/components/node-editor/NodeTitleEditorTextField'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {KeyboardEvent, useCallback, useRef} from 'react'
import {EditorBlockList, EditorBlockListRef} from '@/renderer/components/node-editor/EditorBlockList'
import {calculateCursorPosition} from '@/renderer/util/textarea-measuring'
import {mergeNodeForward, splitNode} from '@/renderer/redux/nodes/thunks'
import {selectDebugMode, useFocusRestore} from '@/renderer/redux/ui/uiSlice'
import {EditorPageBreadcrumbs} from '@/renderer/components/node-editor/EditorPageBreadcrumbs'
import {getNode} from '@/renderer/redux/nodes/helpers'
import {Id, Node} from '@/common/nodes'
import {DateTimeFormatter, Instant, LocalDate, ZonedDateTime, ZoneId} from '@js-joda/core'

export function NodeEditorPage({ nodeId }: {
  nodeId: Id<'node'>,
}) {
  const dispatch = useAppDispatch()
  const node = useAppSelector(state => getNode(state.undoable.present.nodes, nodeId))
  const debugMode = useAppSelector(selectDebugMode)
  const contentNodesList = useRef<EditorBlockListRef | null>(null)
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
        className={'self-start sticky top-0'}
      />
      <div className={'flex flex-col gap-4 w-full max-w-[600px]'}>
        <h1 className={'font-medium text-3xl'}>
          <NodeTitleEditorTextField
            ref={titleEditorRef}
            node={node}
            keyDown={titleKeyDown}
          />
        </h1>
        {debugMode && <NodeDebugInfo node={node}/>}
        <EditorBlockList
          ref={contentNodesList}
          nodes={node.content}
          parentView={nodeView}
          moveFocusBefore={focus}
        />
      </div>
    </div>)
}

function NodeDebugInfo({ node }: { node: Node }) {
  console.log(node)
  const created = ZonedDateTime.ofInstant(Instant.ofEpochMilli(node.history.createdTime), ZoneId.systemDefault())
  const modified = ZonedDateTime.ofInstant(Instant.ofEpochMilli(node.history.lastModifiedTime), ZoneId.systemDefault())
  const format = (date: ZonedDateTime) => {
    const today = LocalDate.now()
    if (date.toLocalDate().equals(today)) {
      return date.toLocalTime().format(DateTimeFormatter.ofPattern('HH:mm'))
    } else {
      return date.toLocalDate().toString()
    }
  }
  return (
    <div className={'text-xs text-muted-foreground'}>
      Created: {format(created)} • Modified: {format(modified)}
    </div>
  )
}
