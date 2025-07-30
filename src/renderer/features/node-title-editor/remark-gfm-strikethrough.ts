import {gfmStrikethrough, Options} from 'micromark-extension-gfm-strikethrough'
import {Data, Processor} from 'unified'
import {Root} from 'mdast'
import {Extension, HtmlExtension} from 'micromark-util-types'
import {gfmStrikethroughFromMarkdown, gfmStrikethroughToMarkdown} from 'mdast-util-gfm-strikethrough'
import {Extension as FromMarkdownExtension} from 'mdast-util-from-markdown'
import {Options as ToMarkdownExtension} from 'mdast-util-to-markdown'


declare module 'unified' {
  interface Data {
    micromarkExtensions?: Extension[]
    micromarkHtmlExtensions?: HtmlExtension[]
    fromMarkdownExtensions?: (FromMarkdownExtension | FromMarkdownExtension[])[]
    toMarkdownExtensions?: ToMarkdownExtension[]
  }
}

export function remarkGfmStrikethrough(options: Options = {}) {
  // @ts-expect-error: TS is wrong about `this`.
  const self = (this as Processor<Root>)
  const data = self.data() as Data

  const micromarkExtensions =
    data.micromarkExtensions || (data.micromarkExtensions = [])
  const fromMarkdownExtensions =
    data.fromMarkdownExtensions || (data.fromMarkdownExtensions = [])
  const toMarkdownExtensions =
    data.toMarkdownExtensions || (data.toMarkdownExtensions = [])

  micromarkExtensions.push(gfmStrikethrough(options))
  fromMarkdownExtensions.push(gfmStrikethroughFromMarkdown())
  toMarkdownExtensions.push(gfmStrikethroughToMarkdown())
}
