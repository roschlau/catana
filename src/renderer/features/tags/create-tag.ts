import {AppDispatch, AppState} from '@/renderer/redux/store'
import {Tag} from '@/common/tags'
import {tagCreated} from '@/renderer/features/tags/tags-slice'
import {chooseRandomElement, tagHues} from '@/renderer/features/tags/tag-colors'

export function createTag(name: string) {
  return async (dispatch: AppDispatch, getState: () => AppState) => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      throw Error('Tag name cannot be empty')
    }
    const baseId = trimmedName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-_/]/g, '') as Tag['id']
    let id: Tag['id'] = baseId || (trimmedName.toLowerCase() as Tag['id'])
    // Suffix the ID with a number if already in use
    let suffix = 2
    const state = getState().undoable.present.tags
    while (state[id]) {
      id = (baseId + '-' + suffix) as Tag['id']
      suffix++
    }
    const hue = await chooseRandomElement(tagHues, trimmedName)
    dispatch(tagCreated({ id, name, hue }))
    return id
  }
}
