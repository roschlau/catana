import {createSelector, createSlice, PayloadAction} from '@reduxjs/toolkit'
import {Tag} from '@/common/tags'
import {AppState} from '@/renderer/redux/store'
import {TextNode} from '@/common/nodes'
import {isPresent} from '@/renderer/util/optionals'
import {displayError} from '@/renderer/features/ui/toasts'

export const testingTags = {
  ['task' as Tag['id']]: {
    id: 'task' as Tag['id'],
    name: 'Task',
    hue: 92,
  },
  ['area' as Tag['id']]: {
    id: 'area' as Tag['id'],
    name: 'Area/Private',
    hue: 127,
  },
  ['shortcut' as Tag['id']]: {
    id: 'shortcut' as Tag['id'],
    name: 'Shortcut',
    hue: 223,
  },
  ['person' as Tag['id']]: {
    id: 'person' as Tag['id'],
    name: 'Person',
    hue: 140,
  },
} satisfies Record<Tag['id'], Tag>

export const tagsSlice = createSlice({
  name: 'tags',
  initialState: {} as Record<Tag['id'], Tag>,
  reducers: {
    tagCreated: (state, action: PayloadAction<{ id: Tag['id'], name: string, hue: number }>) => {
      const { id, name, hue } = action.payload
      state[id] = { id, name, hue }
    },
  },
})

export const selectNodeTags = createSelector([
  (state: AppState) => state.undoable.present.tags,
  (_: AppState, node: TextNode) => node.tags,
], (allTags, nodeTags) => {
  return nodeTags
      ?.map(tagId => {
        const tag = allTags[tagId]
        if (!tag) {
          reportMissingTag(tagId)
          return undefined
        }
        return tag
      })
      ?.filter(isPresent)
    ?? []
})

const knownMissingTags = new Set<Tag['id']>()
function reportMissingTag(tagId: Tag['id']) {
  if (knownMissingTags.has(tagId)) {
    return
  }
  knownMissingTags.add(tagId)
  displayError(`Tag with ID '${tagId}' not found in tags list. Your workspace file might be corrupted.`)
}

export const selectPrimaryTag = (state: AppState, node: TextNode) => {
  if (!node.tags || node.tags.length === 0) {
    return undefined
  }
  return state.undoable.present.tags[node.tags[0]]
}

export const selectAllTags = createSelector([
  (state: AppState) => state.undoable.present.tags,
], (allTags) => Object.values(allTags))

export const { tagCreated } = tagsSlice.actions
