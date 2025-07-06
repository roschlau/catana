import {TextNode} from '@/common/nodes'
import {DateTimeFormatter, Duration, Instant, LocalDateTime, ZoneId} from '@js-joda/core'
import {Locale} from '@js-joda/locale_en'
import {formatDuration} from '@/common/time'

type MarkdownFlavor =
  | 'obsidian'
  | 'logseq'

/**
 * Returns a markdown representation of a single node.
 */
export function toMarkdown(node: TextNode, flavor: MarkdownFlavor = 'logseq'): string {
  let result = '- '
  if (node.checkbox) {
    result += flavor === 'obsidian'
      ? checkboxToObsidian(node.checkbox)
      : checkboxToLogseq(node.checkbox)
  }
  result += node.title
  if (flavor === 'logseq' && node.history.checkbox && node.history.checkbox.length >= 0) {
    result += checkboxHistoryToLogseqLogbook(node.history.checkbox)
  }
  return result
}

function checkboxToObsidian(checkbox: NonNullable<TextNode['checkbox']>): string {
  let result = '['
  if (checkbox === true) result += 'x'
  else if (checkbox === false) result += ' '
  else if (checkbox === 'indeterminate') result += '/'
  result += '] '
  return result
}

function checkboxToLogseq(checkbox: NonNullable<TextNode['checkbox']>): string {
  let result = ''
  if (checkbox === true) result += 'DONE'
  else if (checkbox === false) result += 'TODO'
  else if (checkbox === 'indeterminate') result += 'DOING'
  result += ' '
  return result
}

const logseqLogbookDateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd EE HH:mm:ss")
  .withLocale(Locale.ENGLISH)

function checkboxHistoryToLogseqLogbook(history: NonNullable<TextNode['history']['checkbox']>): string {
  let result = '\n:LOGBOOK:'
  let entryStartTime: LocalDateTime | undefined
  for (const [time, state] of history.toReversed()) {
    if (state === 'indeterminate' && !entryStartTime) {
      entryStartTime = Instant.ofEpochMilli(time).atZone(ZoneId.systemDefault()).toLocalDateTime()
      result += '\n  CLOCK: [' + entryStartTime.format(logseqLogbookDateFormatter) + ']'
    } else if (state !== 'indeterminate' && entryStartTime) {
      const endTime = Instant.ofEpochMilli(time).atZone(ZoneId.systemDefault()).toLocalDateTime()
      const duration = Duration.between(entryStartTime, endTime)
      result += '--[' + endTime.format(logseqLogbookDateFormatter) + '] =>  ' + formatDuration(duration)
      entryStartTime = undefined
    }
  }
  return result + '\n:END:'
}
