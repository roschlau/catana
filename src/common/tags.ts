import {Brand} from '@ark/util/'

export interface Tag {
  id: Brand<string, 'tag'>,
  name: string,
  hue: number,
}

/**
 * Finds and returns the position of the closest suggestionChar occurrence before the cursor position that's not
 * separated from it by whitespace, if such a character exists.
 */
export function findSuggestionStartPosition(text: string, suggestionChar: string, cursorPosition: number): number {
  let i = cursorPosition - 1
  let hashPosition = -1
  while (i >= 0) {
    const prevChar = text[i]
    if (prevChar === suggestionChar) {
      hashPosition = i
      break
    }
    if (/\s/.test(prevChar)) break
    i -= 1
  }
  return hashPosition
}
