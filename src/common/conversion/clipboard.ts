import {type} from 'arktype'
import {TextNode} from '@/common/nodes'
import {toMarkdown} from '@/common/conversion/markdown'
import {tryParseLogseq} from '@/common/conversion/logseq-parser'
import {TreeTextNode} from '@/common/node-tree'

const catanaNodeIdsMimeType = 'x-catana/nodeIds'

const ClipboardNodes = type('string#node[]')
type ClipboardNodes = typeof ClipboardNodes.infer

export function copyNode(node: TextNode, clipboardData: DataTransfer) {
  clipboardData.setData('text/plain', toMarkdown(node))
  clipboardData.setData(catanaNodeIdsMimeType, JSON.stringify(ClipboardNodes([node.id])))
}

type ClipboardData = {
  text: string,
  nodeTrees?: TreeTextNode[],
  nodeIds?: ClipboardNodes,
}

export function readClipboard(clipboardData: DataTransfer): ClipboardData {
  const customData = clipboardData.getData(catanaNodeIdsMimeType)
  const parsed = customData ? ClipboardNodes(JSON.parse(customData)) : undefined
  if (parsed instanceof type.errors) {
    console.error(parsed)
    throw Error('Clipboard Data could not be parsed: ' + parsed.summary)
  }
  const plainText = clipboardData.getData('text/plain')
  const fromLogseq = tryParseLogseq(plainText)
  return {
    text: plainText,
    nodeTrees: fromLogseq,
    nodeIds: parsed,
  }
}
