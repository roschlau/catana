import React, {MouseEvent, useState} from 'react'
import {useAppDispatch} from '@/renderer/redux/hooks'
import Markdown, {Components} from 'react-markdown'
import {TextNode} from '@/common/nodes'
import {nodeOpened} from '@/renderer/features/navigation/navigation-slice'
import {TooltipSimple} from '@/renderer/components/ui/tooltip'
import {suppressUnsupportedMd} from '@/common/markdown-utils'
import {remarkGfmStrikethrough} from '@/renderer/features/node-editor/remark-gfm-strikethrough'
import {remarkGfmAutolinkLiteral} from '@/renderer/features/node-editor/remark-gfm-autolink'
import rehypeSanitize from 'rehype-sanitize'
import {cn} from '@/renderer/util/tailwind'

export const RenderedNodeTitle = React.memo(function RenderedNodeTitle({
  title, className, onClick,
}: {
  title: string,
  className?: string,
  onClick?: (e: MouseEvent) => void,
}) {
  const dispatch = useAppDispatch()
  const [components] = useState<Components>({
    a(props) {
      if (props.href?.startsWith('catana://')) {
        // TODO this doesn't currently work because the href is already being sanitized before
        const nodeId = props.href.slice('catana://'.length) as TextNode['id']
        const { node, href, ...rest } = props
        return <a {...rest} onClick={() => dispatch(nodeOpened({ nodeId }))}/>
      } else {
        const { node, ...rest } = props
        const link = <a
          {...rest}
          target={'_blank'} rel={'noreferrer'}
        />
        if (rest.children === rest.href) {
          return link
        }
        return (
          <TooltipSimple content={props.href} side={'bottom'} delayed>
            {link}
          </TooltipSimple>
        )
      }
    },
  })
  return (
    <div
      className={cn('markdown-container', className)}
      onClick={onClick}
    >
      <Markdown
        rehypePlugins={nodeTitleRehypePlugins}
        remarkPlugins={nodeTitleRemarkPlugins}
        components={components}
      >
        {suppressUnsupportedMd(title) || 'Empty'}
      </Markdown>
    </div>
  )
})

const nodeTitleRehypePlugins = [rehypeSanitize]
const nodeTitleRemarkPlugins = [remarkGfmStrikethrough, remarkGfmAutolinkLiteral]
