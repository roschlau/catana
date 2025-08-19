import {Brand} from '@ark/util/'

export interface Tag {
  id: Brand<string, 'tag'>,
  name: string,
  hue: number,
  history: {
    createdTime: number,
    lastModifiedTime: number,
  },
}

/**
 * Finds and returns the position of the closest triggerChar occurrence before the cursor position that's not
 * separated from it by whitespace, if such a character exists.
 */
export function findSuggestionTriggerCharPosition(text: string, triggerChar: string, cursorPosition: number): number {
  let i = cursorPosition - 1
  let triggerPosition = -1
  while (i >= 0) {
    const prevChar = text[i]
    if (prevChar === triggerChar) {
      triggerPosition = i
      break
    }
    if (/\s/.test(prevChar)) break
    i -= 1
  }
  return triggerPosition
}
