import {createSelector, createSlice} from '@reduxjs/toolkit'
import {Tag} from '@/common/tags'
import {AppState} from '@/renderer/redux/store'
import {TextNode} from '@/common/nodes'

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
  initialState: testingTags,
  reducers: {},
})

export const selectNodeTags = createSelector([
  (state: AppState) => state.undoable.present.tags,
  (_: AppState, node: TextNode) => node.tags,
], (allTags, nodeTags) => {
  return nodeTags?.map(tagId => allTags[tagId]) ?? []
})

export const selectPrimaryTag = (state: AppState, node: TextNode) => {
  if (!node.tags || node.tags.length === 0) { return undefined }
  return state.undoable.present.tags[node.tags[0]]
}
