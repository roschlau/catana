import {Selection} from '@/renderer/util/selection'

/**
 * Given a string of text content and a selection within that content, this function will expand
 * the selection to the next bigger surrounding logical block in the content.
 * Logical blocks are considered:
 *
 * - Words
 * - Non-whitespace sequences of characters
 * - Sentences
 * - Entire content
 *
 * The function attempts to expand to the lowest level block and moves up through block types
 * until the first one that actually produces a change in the selection.
 */
export function expandSelection(content: string, selection: Selection): Selection {
  // Level 1: Expand to word boundaries
  const isWordChar = (char: string) => /[^\W_]/.test(char)
  let wordStart = selection.start
  while (wordStart > 0 && isWordChar(content[wordStart - 1])) {
    wordStart--
  }
  let wordEnd = selection.end
  while (wordEnd < content.length && isWordChar(content[wordEnd])) {
    wordEnd++
  }
  if (selection.start !== wordStart || selection.end !== wordEnd) {
    return { start: wordStart, end: wordEnd }
  }

  // Level 2: Expand to non-whitespace sequence
  const isWhitespace = (char: string) => /\s/.test(char)
  let nonWhitespaceStart = selection.start
  while (nonWhitespaceStart > 0 && !isWhitespace(content[nonWhitespaceStart - 1])) {
    nonWhitespaceStart--
  }
  let nonWhitespaceEnd = selection.end
  while (nonWhitespaceEnd < content.length && !isWhitespace(content[nonWhitespaceEnd])) {
    nonWhitespaceEnd++
  }
  if (selection.start !== nonWhitespaceStart || selection.end !== nonWhitespaceEnd) {
    return { start: nonWhitespaceStart, end: nonWhitespaceEnd }
  }

  // Level 3: Expand to sentence boundaries
  const isSentenceDelimiter = (char: string) => /[.!?;]/.test(char)

  // Find the start of the sentence (after the previous sentence delimiter followed by whitespace)
  let sentenceStart = selection.start

  // Look backwards for a sentence delimiter
  while (sentenceStart > 0) {
    sentenceStart--
    // If we find a sentence delimiter
    if (isSentenceDelimiter(content[sentenceStart])) {
      // Look for the next whitespace after the delimiter
      let tempPos = sentenceStart + 1
      while (tempPos < content.length && !/\s/.test(content[tempPos])) {
        tempPos++
      }

      // If we found whitespace, the sentence starts after it
      if (tempPos < content.length) {
        sentenceStart = tempPos + 1
      }
      break
    }
  }

  // Find the end of the sentence (including the sentence delimiter)
  let sentenceEnd = selection.end

  // Move past at least one sentence delimiter
  while (sentenceEnd < content.length && !isSentenceDelimiter(content[sentenceEnd - 1])) {
    sentenceEnd++
  }
  // Move past the last sentence delimiter in the sequence
  while (sentenceEnd < content.length && isSentenceDelimiter(content[sentenceEnd])) {
    sentenceEnd++
  }

  if (selection.start !== sentenceStart || selection.end !== sentenceEnd) {
    return { start: sentenceStart, end: sentenceEnd }
  }

  return { start: 0, end: content.length }
}
