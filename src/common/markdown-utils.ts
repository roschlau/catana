import {Selection} from '@/renderer/util/selection'

/**
 * If `range` within `input` is surrounded by `prefix` and `suffix`, returns a string with the prefix and suffix removed
 * from the range. Otherwise, returns a string with prefix and suffix added to the given range.
 * If the range contains leading or trailing spaces, it will be narrowed to exclude them first.
 * @returns An object containing the resulting string, and the range within the new string that the old range maps onto
 *          after correcting for spaces and inserting/removing the prefix and suffix.
 */
export function markRange(
  input: string,
  range: Selection,
  mode: 'toggle' | 'enclose',
  prefix: string,
  suffix: string = prefix,
): { result: string, mappedRange: Selection } {
  // Adjust range to exclude spaces at the start and end
  let adjustedStart = range.start
  let adjustedEnd = range.end

  // Skip spaces at the start of selection
  while (adjustedStart < range.end && input.charAt(adjustedStart) === ' ') {
    adjustedStart++
  }

  // Skip spaces at the end of selection
  while (adjustedEnd > adjustedStart && input.charAt(adjustedEnd - 1) === ' ') {
    adjustedEnd--
  }

  // Get the text before, within, and after the adjusted selection
  const before = input.substring(0, adjustedStart)
  const selected = input.substring(adjustedStart, adjustedEnd)
  const after = input.substring(adjustedEnd)

  const shouldRemove = mode === 'toggle' && before.endsWith(prefix) && after.startsWith(suffix)

  if (shouldRemove) {
    // Remove the surrounding prefix and suffix
    return {
      result: before.substring(0, before.length - prefix.length) + selected + after.substring(suffix.length),
      mappedRange: { start: before.length - prefix.length, end: (before + selected).length - prefix.length },
    }
  } else {
    // Add prefix and suffix
    return {
      result: before + prefix + selected + suffix + after,
      mappedRange: { start: (before + prefix).length, end: (before + prefix + selected).length },
    }
  }
}

/**
 * Adds escape sequences to suppress rendering of constructs that Catana does not suppoert, like headings and
 * blockquotes. This is just a "good enough" solution for now, might revisit and handle this differently in the future.
 * It is *not* meant as a security measure.
 *
 * Currently suppresses:
 * - Headings
 * - Blockquotes
 * - Any HTML tags
 */
export function suppressUnsupportedMd(markdown: string): string {
  return markdown
    .replace(/((^#)|[<>])/g, '\\$1')
}
