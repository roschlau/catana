import {TextNode} from '@/common/nodes'

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
