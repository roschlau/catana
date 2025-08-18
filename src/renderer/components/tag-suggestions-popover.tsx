import React, {KeyboardEvent, useCallback, useEffect, useMemo} from 'react'
import {Popover, PopoverAnchor, PopoverContent} from '@/renderer/components/ui/popover'
import {tagApplied, titleUpdated} from '@/renderer/features/node-graph/nodes-slice'
import {cn} from '@/renderer/util/tailwind'
import {TagBadge} from '@/renderer/components/ui/tag-badge'
import {CornerDownLeftIcon} from 'lucide-react'
import {Slot} from '@radix-ui/react-slot'
import {findSuggestionTriggerCharPosition, Tag} from '@/common/tags'
import {textSearchMatch} from '@/renderer/util/string-matching'
import {createUndoTransaction} from '@/renderer/redux/undoTransactions'
import {createTag} from '@/renderer/features/tags/create-tag'
import {focusRestoreRequested} from '@/renderer/features/ui/uiSlice'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {selectAllTags} from '@/renderer/features/tags/tags-slice'
import {TextNode} from '@/common/nodes'
import {NodeView} from '@/common/node-views'

/**
 * A popover wrapping a textarea that automatically shows when the user types a hashtag.
 * This component passes through all props all props of the wrapped textarea. Don't register any event handlers
 * directly on the wrapped textarea, as that might break this component's functionality.
 * TODO To be refactored to be generically usable for any other kind of suggestions
 */
export const TagSuggestionsPopover = function SuggestionsTextarea({
  nodeView,
  node,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}: React.ComponentProps<'textarea'> & { node: TextNode, nodeView: NodeView<TextNode>, }) {
  const dispatch = useAppDispatch()
  const allTags = useAppSelector(state => selectAllTags(state))

  const textAreaRef = React.useRef<HTMLTextAreaElement>(null)

  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const [triggerCharPosition, setTriggerCharPosition] = React.useState<number | null>(null)
  const [query, setQuery] = React.useState('')
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = React.useState(0)

  const resetSelection = useCallback(() => {
    setPopoverOpen(false)
    setTriggerCharPosition(null)
    setQuery('')
    setHighlightedSuggestionIndex(0)
  }, [])

  const filteredSuggestions = useMemo<Tag[]>(() => {
    if (!popoverOpen) return []
    return allTags.filter(t => textSearchMatch(t.name, query))
  }, [allTags, popoverOpen, query])

  const hasExactMatch = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return false
    return allTags.some(t => t.name.toLowerCase() === q)
  }, [allTags, query])

  const updateQuery = useCallback(() => {
    const textArea = textAreaRef.current
    if (!textArea) return
    const selectionStart = textArea.selectionStart
    const text = textArea.value
    const triggerPosition = findSuggestionTriggerCharPosition(text, '#', selectionStart)
    if (triggerPosition === -1) {
      resetSelection()
      return
    }
    const query = text.slice(triggerPosition + 1, selectionStart)
    if (/\s/.test(query)) {
      resetSelection()
      return
    }
    setTriggerCharPosition(triggerPosition)
    setQuery(query)
  }, [resetSelection])

  // Wrap highlighted suggestion if it moved outside the valid range
  useEffect(() => {
    const maxIndex = filteredSuggestions.length + (hasExactMatch || !query.trim() ? 0 : 1) - 1
    if (highlightedSuggestionIndex > maxIndex) {
      setHighlightedSuggestionIndex(0)
    } else if (highlightedSuggestionIndex < 0) {
      setHighlightedSuggestionIndex(maxIndex)
    }
  }, [filteredSuggestions, hasExactMatch, highlightedSuggestionIndex, query])

  const applyTagSelection = useCallback(async (index: number, caretPos: number) => {
    let selectedTagId: Tag['id'] | null = null
    dispatch(createUndoTransaction(async dispatch => {
      if (index < filteredSuggestions.length) {
        selectedTagId = filteredSuggestions[index]?.id
      } else if (!hasExactMatch && query.trim()) {
        selectedTagId = await dispatch(createTag(query))
      }
      if (selectedTagId && triggerCharPosition !== null) {
        const start = triggerCharPosition
        const newTitle = node.title.slice(0, start) + node.title.slice(caretPos)
        dispatch(titleUpdated({ nodeId: node.id, title: newTitle }))
        dispatch(tagApplied({ nodeId: node.id, tagId: selectedTagId }))
        dispatch(focusRestoreRequested({ nodeView, selection: { start, end: start } }))
      }
    }))
    resetSelection()
  }, [filteredSuggestions, hasExactMatch, query, dispatch, triggerCharPosition, node.title, node.id, nodeView, resetSelection])

  const _keyUp = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (popoverOpen) {
      updateQuery()
    }
    onKeyUp?.(e)
  }, [onKeyUp, popoverOpen, updateQuery])

  const _keyDown = useCallback(async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (popoverOpen) {
      if (e.key === 'Escape') {
        e.preventDefault()
        resetSelection()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedSuggestionIndex(i => i + 1) // Separate effect takes care of wrapping
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedSuggestionIndex(i => i - 1) // Separate effect takes care of wrapping
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        await applyTagSelection(highlightedSuggestionIndex, e.currentTarget.selectionStart)
        return
      }
    } else {
      if (e.key === '#') {
        setPopoverOpen(true)
      }
    }
    onKeyDown?.(e)
  }, [applyTagSelection, highlightedSuggestionIndex, onKeyDown, resetSelection, popoverOpen])

  const TextareaSlot: React.ForwardRefExoticComponent<React.ComponentProps<'textarea'>> = Slot
  return (
    <Popover open={popoverOpen}>
      <PopoverAnchor asChild>
        <TextareaSlot
          ref={textAreaRef}
          onKeyDown={_keyDown}
          onKeyUp={_keyUp}
          onBlur={(e) => {
            resetSelection()
            onBlur?.(e)
          }}
          {...props}
        />
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className="p-0 w-auto min-w-72 max-w-[50vw]"
        onOpenAutoFocus={e => e.preventDefault()} // Keep focus in textarea
      >
        <div className="max-h-64 overflow-auto p-1">
          {filteredSuggestions.map((suggestion, suggestionIndex) => (
            <SuggestionPopoverEntry
              key={suggestion.id}
              highlighted={suggestionIndex === highlightedSuggestionIndex}
              onMouseEnter={() => setHighlightedSuggestionIndex(suggestionIndex)}
              onMouseDown={() => {
                void applyTagSelection(suggestionIndex, textAreaRef.current?.selectionStart ?? 0)
              }}
            >
              <TagBadge className={'cursor-pointer'} hue={suggestion.hue}>{suggestion.name}</TagBadge>
            </SuggestionPopoverEntry>
          ))}
          {!hasExactMatch && query.trim() && (
            <SuggestionPopoverEntry
              highlighted={highlightedSuggestionIndex === filteredSuggestions.length}
              onMouseEnter={() => setHighlightedSuggestionIndex(filteredSuggestions.length)}
              onMouseDown={() => {
                void applyTagSelection(filteredSuggestions.length, textAreaRef.current?.selectionStart ?? 0)
              }}
            >
              Create new tag
              <TagBadge className={'ms-2 cursor-pointer'} hue={null}>{query.trim()}</TagBadge>
            </SuggestionPopoverEntry>
          )}
          {filteredSuggestions.length === 0 && !query.trim() && (
            <div className="p-1 rounded text-muted-foreground">Type to create your first tag!</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function SuggestionPopoverEntry({
  highlighted,
  children,
  className,
  ...props
}: {
  highlighted: boolean,
} & React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'p-1 rounded cursor-pointer flex flex-row items-center',
        { 'bg-accent text-accent-foreground': highlighted },
        className,
      )}
      {...props}
    >
      {children}
      <div className={'grow'}/>
      {highlighted && <CornerDownLeftIcon size={16} className={'text-muted-foreground'}/>}
    </div>
  )
}
