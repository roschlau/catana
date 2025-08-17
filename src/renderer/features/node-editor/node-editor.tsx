import TextareaAutosize from 'react-textarea-autosize'
import {checkboxUpdated, tagApplied, tagRemoved, titleUpdated} from '@/renderer/features/node-graph/nodesSlice'
import React, {
  ClipboardEvent,
  KeyboardEvent,
  MouseEvent,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {Selection} from '@/renderer/util/selection'
import {Checkbox} from '@/renderer/components/ui/checkbox'
import {CheckboxState, cycleCheckboxState, inProgressDuration} from '@/common/checkboxes'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {TextNode} from '@/common/nodes'
import {deserialize, SerializedNodeView} from '@/common/node-views'
import {focusRestoreRequested, setCommandFocus} from '@/renderer/features/ui/uiSlice'
import {getNode} from '@/renderer/features/node-graph/helpers'
import {modKey} from '@/renderer/util/keyboard'
import {insertNodeLinks, insertTrees} from '@/renderer/features/node-graph/insert-content'
import {copyNode, readClipboard} from '@/common/conversion/clipboard'
import {flatten} from '@/common/node-tree'
import {cn} from '@/renderer/util/tailwind'
import {isLink, markRange} from '@/common/markdown-utils'
import {TooltipSimple} from '@/renderer/components/ui/tooltip'
import {getEditorActionThunk} from '@/renderer/features/node-editor/editor-actions'
import {expandSelection} from '@/renderer/util/expand-selection'
import {displayWarning} from '@/renderer/features/ui/toasts'
import {CheckedState} from '@radix-ui/react-checkbox'
import {DurationFormat, formatDuration} from '@/common/time'
import {RenderedNodeTitle} from '@/renderer/features/node-editor/rendered-node-title'
import {TagBadge} from '@/renderer/components/ui/tag-badge'
import {selectAllTags, selectNodeTags} from '@/renderer/features/tags/tags-slice'
import {TagAccentColorProvider} from '@/renderer/features/tags/tag-accent-color-provider'
import {Popover, PopoverAnchor, PopoverContent} from '@/renderer/components/ui/popover'
import {findSuggestionStartPosition, Tag} from '@/common/tags'
import {textSearchMatch} from '@/renderer/util/string-matching'
import {CornerDownLeftIcon} from 'lucide-react'
import {createTag} from '@/renderer/features/tags/create-tag'

export interface NodeTitleEditorTextFieldRef {
  focus: (selection?: Selection) => void
}

/**
 * Displays a text area for the user to edit the title of a node.
 * Handles dispatching actions for title editing itself, any other input is passed to the parent via `keyDown`.
 */
export const NodeEditor = React.memo(function NodeEditor({
  nodeView, onKeyDown, ref,
}: {
  nodeView: SerializedNodeView,
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void,
  ref?: Ref<NodeTitleEditorTextFieldRef>,
}) {
  const nv = useMemo(() => deserialize<TextNode>(nodeView), [nodeView])
  useImperativeHandle(ref, () => ({
    focus: (selection) => {
      setIsEditing(true)
      if (selection) {
        setSelectionRange(selection)
      }
    },
  }))
  const dispatch = useAppDispatch()
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null)
  const node = useAppSelector(state => getNode(state.undoable.present.nodes, nv.nodeId))
  const tags = useAppSelector(state => selectNodeTags(state, node))
  const allTags = useAppSelector(state => selectAllTags(state))

  const [isEditing, setIsEditing] = React.useState(false)
  const [selectionRange, setSelectionRange] = React.useState(null as null | Selection)

  // Tag popover state
  const [tagPopoverOpen, setTagPopoverOpen] = React.useState(false)
  const [hashtagCharPosition, setHashtagCharPosition] = React.useState<number | null>(null)
  const [tagQuery, setTagQuery] = React.useState('')
  const [highlightedTagSuggestionIndex, setHighlightedTagSuggestionIndex] = React.useState(0)

  const resetTagSelection = useCallback(() => {
    setTagPopoverOpen(false)
    setHashtagCharPosition(null)
    setTagQuery('')
    setHighlightedTagSuggestionIndex(0)
  }, [])

  const tagSuggestions = useMemo<Tag[]>(() => {
    if (!tagPopoverOpen) return []
    return allTags.filter(t => textSearchMatch(t.name, tagQuery))
  }, [allTags, tagPopoverOpen, tagQuery])

  const hasExactMatch = useMemo(() => {
    const q = tagQuery.trim().toLowerCase()
    if (!q) return false
    return allTags.some(t => t.name.toLowerCase() === q)
  }, [allTags, tagQuery])

  const updateFromCaret = useCallback(() => {
    const textArea = textAreaRef.current
    if (!textArea) return
    const selectionStart = textArea.selectionStart
    const text = textArea.value
    const hashPosition = findSuggestionStartPosition(text, '#', selectionStart)
    if (hashPosition === -1) {
      resetTagSelection()
      return
    }
    const tagQuery = text.slice(hashPosition + 1, selectionStart)
    if (/\s/.test(tagQuery)) {
      resetTagSelection()
      return
    }
    setHashtagCharPosition(hashPosition)
    setTagQuery(tagQuery)
    setTagPopoverOpen(true)
  }, [resetTagSelection])

  useEffect(() => {
    if (!isEditing) {
      resetTagSelection()
    }
  }, [isEditing, resetTagSelection])

  useEffect(() => {
    if (tagPopoverOpen) {
      updateFromCaret()
    }
  }, [tagPopoverOpen, updateFromCaret])

  // Wrap highlighted tag suggestion if it moved outside the valid range
  useEffect(() => {
    const maxIndex = tagSuggestions.length + (hasExactMatch || !tagQuery.trim() ? 0 : 1) - 1
    if (highlightedTagSuggestionIndex > maxIndex) {
      setHighlightedTagSuggestionIndex(0)
    } else if (highlightedTagSuggestionIndex < 0) {
      setHighlightedTagSuggestionIndex(maxIndex)
    }
  }, [tagSuggestions, hasExactMatch, highlightedTagSuggestionIndex, tagQuery])

  useLayoutEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus()
      if (selectionRange !== null) {
        textAreaRef.current.setSelectionRange(selectionRange.start, selectionRange.end)
        setSelectionRange(null)
      }
    }
  }, [selectionRange, isEditing])

  const handleDisplayClick = useCallback((e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) return
    const offset = window.getSelection()?.focusOffset ?? 0
    setSelectionRange({ start: offset, end: offset })
    setIsEditing(true)
  }, [setSelectionRange, setIsEditing])

  const checkboxChecked = node.checkbox
  const setCheckbox = useCallback((state: CheckboxState | null) => {
    dispatch(checkboxUpdated({
      nodeId: node.id,
      state: state,
    }))
  }, [dispatch, node.id])

  const applyTagSelection = useCallback(async (index: number, caretPos: number) => {
    let selectedTagId: Tag['id'] | null = null
    dispatch(createUndoTransaction(async dispatch => {
      if (index < tagSuggestions.length) {
        selectedTagId = tagSuggestions[index]?.id
      } else if (!hasExactMatch && tagQuery.trim()) {
        selectedTagId = await dispatch(createTag(tagQuery))
      }
      if (selectedTagId && hashtagCharPosition !== null) {
        const start = hashtagCharPosition
        const newTitle = node.title.slice(0, start) + node.title.slice(caretPos)
          dispatch(titleUpdated({ nodeId: node.id, title: newTitle }))
          dispatch(tagApplied({ nodeId: node.id, tagId: selectedTagId }))
          dispatch(focusRestoreRequested({ nodeView: nv, selection: { start, end: start } }))
      }
    }))
    resetTagSelection()
  }, [tagSuggestions, hasExactMatch, tagQuery, dispatch, hashtagCharPosition, node.title, node.id, nv, resetTagSelection])

  const _keyDown = useCallback(async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const currentSelection: Selection = {
      start: e.currentTarget.selectionStart,
      end: e.currentTarget.selectionEnd,
    }

    // Tag popover key handling
    if (tagPopoverOpen) {
      if (e.key === 'Escape') {
        e.preventDefault()
        resetTagSelection()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedTagSuggestionIndex(i => i + 1) // Separate effect takes care of wrapping
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedTagSuggestionIndex(i => i - 1) // Separate effect takes care of wrapping
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        await applyTagSelection(highlightedTagSuggestionIndex, e.currentTarget.selectionStart)
        return
      }
      // For any other key that moves caret/content, update selection after keydown
      setTimeout(() => updateFromCaret(), 0)
    } else {
      // Open tag selection popover if hashtag typed
      if (e.key === '#') {
        // Open popover starting here; actual query computed on next tick
        setTimeout(() => updateFromCaret(), 0)
        console.log('Opening popover')
        setTagPopoverOpen(true)
      }
    }

    if (['z', 'Z'].includes(e.key) && modKey(e)) {
      // Undo/Redo is handled globally, so prevent the browser's default behavior from interfering
      e.preventDefault()
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setIsEditing(false)
      return
    }
    const editorAction = getEditorActionThunk(e, node, nv, currentSelection)
    if (editorAction) {
      e.preventDefault()
      dispatch(editorAction)
      return
    }
    if (e.key === 'w' && modKey(e)) {
      e.preventDefault()
      setSelectionRange(expandSelection(node.title, currentSelection))
      return
    }
    if (e.key === 'Enter' && modKey(e)) {
      e.preventDefault()
      const newState = cycleCheckboxState(node.checkbox)
      setCheckbox(newState)
      return
    }
    if (e.key === 'k' && modKey(e)) {
      // User triggered the command prompt while focused on this node, so set this node as the command focus
      dispatch(setCommandFocus({
        nodeView: nv,
        selection: { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd },
      }))
      // Not preventing the default here so that the global handler can open the prompt normally
      return
    }
    if (e.key === ' ' && checkboxChecked === undefined
      && node.title.startsWith('[]') && e.currentTarget.selectionStart === 2 && e.currentTarget.selectionStart === 2
    ) {
      e.preventDefault()
      // Add the typed space normally first. This makes sure you can Undo to still get a node beginning with the
      // literal text `[] ` if you need that for some reason.
      dispatch(titleUpdated({ nodeId: node.id, title: '[] ' + node.title.slice(2) }))
      dispatch(createUndoTransaction((dispatch) => {
        dispatch(checkboxUpdated({
          nodeId: node.id,
          state: false,
        }))
        dispatch(titleUpdated({ nodeId: node.id, title: node.title.slice(2) }))
      }))
      return
    }
    onKeyDown?.(e)
  }, [tagPopoverOpen, node, nv, checkboxChecked, onKeyDown, resetTagSelection, applyTagSelection, highlightedTagSuggestionIndex, updateFromCaret, dispatch, setCheckbox])

  const onCopy = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.currentTarget.selectionStart !== e.currentTarget.selectionEnd) {
      // Let the default behavior do its thing to copy just a selection of the node's title
      return
    }
    e.preventDefault()
    copyNode(node, e.clipboardData)
  }

  const onPaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const { nodeIds, nodeTrees, plainText } = readClipboard(e.clipboardData)
    if (nodeIds) {
      e.preventDefault()
      try {
        dispatch(insertNodeLinks(nv, nodeIds))
        return
      } catch {
        displayWarning(`Failed to insert node links from clipboard. Falling back to plain content.`, { logData: nodeIds })
      }
    }
    if (nodeTrees && nodeTrees.length > 0) {
      e.preventDefault()
      dispatch(insertTrees(nv, nodeTrees.map(nodeTree => flatten(nodeTree))))
      return
    }
    const selection = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd }
    if (selection.start !== selection.end && isLink(plainText)) {
      e.preventDefault()
      const suffix = '](' + plainText + ')'
      const { result, mappedRange } = markRange(node.title, selection, 'enclose', '[', suffix)
      dispatch(titleUpdated({ nodeId: node.id, title: result }))
      dispatch(focusRestoreRequested({ nodeView: nv, selection: { start: mappedRange.end + suffix.length } }))
      return
    }
  }

  const sharedClasses = cn('grow py-0.5')
  const textareaClasses = cn(
    sharedClasses,
    'bg-none border-none resize-none focus:text-foreground outline-none',
  )
  const divClasses = cn(
    sharedClasses,
    'bg-none border-none resize-none cursor-text space-x-[.5em]',
    { 'line-through text-muted-foreground': checkboxChecked === true },
    { 'text-muted-foreground': !node.title },
  )

  const tagElements = tags.map(tag => (
    <TagBadge
      key={tag.id}
      hue={tag.hue}
      onRemoveClick={(e) => {
        e.stopPropagation()
        dispatch(tagRemoved({ nodeId: node.id, tagId: tag.id }))
      }}
    >
      {tag.name}
    </TagBadge>
  ))

  return (
    <TagAccentColorProvider hue={tags[0]?.hue}>
      <div
        className={'w-full flex flex-row items-baseline gap-2'}
        onClick={isEditing ? undefined : handleDisplayClick}
      >
        {checkboxChecked !== undefined && <NodeCheckbox
          history={node.history.checkbox}
          checked={checkboxChecked}
          onCheckedChange={setCheckbox}
        />}
        {isEditing && (
          <>
            <Popover open={tagPopoverOpen}>
              <PopoverAnchor asChild>
                <TextareaAutosize
                  ref={textAreaRef}
                  className={textareaClasses}
                  value={node.title}
                  placeholder={'Empty'}
                  onChange={e => dispatch(titleUpdated({ nodeId: node.id, title: e.target.value }))}
                  onKeyDown={_keyDown}
                  onCopy={onCopy}
                  onPaste={onPaste}
                  onBlur={() => {
                    setIsEditing(false)
                    resetTagSelection()
                  }}
                />
              </PopoverAnchor>
              <PopoverContent
                align="start"
                className="p-0 w-auto min-w-72 max-w-[50vw]"
                onOpenAutoFocus={e => e.preventDefault()} // Keep focus in textarea
              >
                <div className="max-h-64 overflow-auto p-1">
                  {tagSuggestions.map((tag, suggestionIndex) => (
                    <div
                      key={tag.id}
                      className={cn(
                        'p-1 rounded cursor-pointer flex flex-row items-center',
                        { 'bg-accent text-accent-foreground': suggestionIndex === highlightedTagSuggestionIndex }
                      )}
                      onMouseEnter={() => setHighlightedTagSuggestionIndex(suggestionIndex)}
                      onMouseDown={(ev) => {
                        ev.preventDefault()
                        void applyTagSelection(suggestionIndex, textAreaRef.current?.selectionStart ?? 0)
                      }}
                    >
                      <TagBadge className={'cursor-pointer'} hue={tag.hue}>{tag.name}</TagBadge>
                      <div className={'grow'}/>
                      {suggestionIndex === highlightedTagSuggestionIndex && <CornerDownLeftIcon size={16} className={'text-muted-foreground'}/>}
                    </div>
                  ))}
                  {!hasExactMatch && tagQuery.trim() && (
                    <div
                      className={cn(
                        'p-1 rounded cursor-pointer flex flex-row items-center',
                        { 'bg-accent text-accent-foreground': highlightedTagSuggestionIndex === tagSuggestions.length }
                      )}
                      onMouseEnter={() => setHighlightedTagSuggestionIndex(tagSuggestions.length)}
                      onMouseDown={(ev) => {
                        ev.preventDefault()
                        void applyTagSelection(tagSuggestions.length, textAreaRef.current?.selectionStart ?? 0)
                      }}
                    >
                      Create new tag
                      <TagBadge className={'ms-2 cursor-pointer'} hue={null}>{tagQuery.trim()}</TagBadge>
                      <div className={'grow'}/>
                      {highlightedTagSuggestionIndex === tagSuggestions.length && <CornerDownLeftIcon size={16} className={'text-muted-foreground'}/>}
                    </div>
                  )}
                  {tagSuggestions.length === 0 && !tagQuery.trim() && (
                    <div className="p-1 rounded text-muted-foreground">Type to search tags</div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {tagElements}
          </>
        ) || (
          <div className={divClasses}>
            <RenderedNodeTitle
              title={node.title}
              className={cn({ 'text-muted-foreground': !node.title })}
            />
            {tagElements}
          </div>
        )}
      </div>
    </TagAccentColorProvider>
  )
})

export function NodeCheckbox({
  history,
  checked,
  onCheckedChange,
}: {
  history: TextNode['history']['checkbox'],
  checked: CheckedState,
  onCheckedChange: (state: CheckedState) => void,
}) {
  const duration = inProgressDuration(history ?? [])
  const tooltip = duration ? formatDuration(duration, DurationFormat.letters) : 'No history'
  return (
    <TooltipSimple content={tooltip}>
      <Checkbox
        className={'translate-y-0.5'}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </TooltipSimple>
  )
}
