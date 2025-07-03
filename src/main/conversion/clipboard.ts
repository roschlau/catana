import {type} from 'arktype'
import {TextNode} from '@/common/nodes'
import {toMarkdown} from '@/main/conversion/markdown'

const catanaNodesMimeType = 'x-catana/nodes'

const ClipboardNodes = type('string#node[]')
type ClipboardNodes = typeof ClipboardNodes.infer

export function copyNode(node: TextNode, clipboardData: DataTransfer) {
  clipboardData.setData('text/plain', toMarkdown(node))
  clipboardData.setData(catanaNodesMimeType, JSON.stringify(ClipboardNodes([node.id])))
}

type ClipboardData = {
  text: string,
  nodeIds?: ClipboardNodes,
}

export function readClipboard(clipboardData: DataTransfer): ClipboardData {
  const customData = clipboardData.getData(catanaNodesMimeType)
  const parsed = customData ? ClipboardNodes(JSON.parse(customData)) : undefined
  if (parsed instanceof type.errors) {
    console.error(parsed)
    throw Error(parsed.summary)
  }
  return {
    text: clipboardData.getData('text/plain'),
    nodeIds: parsed,
  }
}
