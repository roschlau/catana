import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/renderer/components/ui/breadcrumb'
import {useAppDispatch, useAppSelector} from '@/renderer/redux/hooks'
import {nodeOpened} from '@/renderer/redux/ui/uiSlice'
import {Fragment} from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu'
import {selectAncestry} from '@/renderer/redux/nodes/selectors'
import {Field, TextNode} from '@/common/nodes'

/**
 * Renders a breadcrumb trail for the current Doc. Property docs in the ancestry, they will be skipped.
 */
export function EditorPageBreadcrumbs({ node, className }: {
  node: TextNode | Field,
  className?: string
}) {
  const dispatch = useAppDispatch()
  const path = useAppSelector(state => selectAncestry(state, node))
    .filter((it): it is TextNode => it.type === 'node')

  const ellipsize = (max: number, text: string) => {
    if (text.length <= max) {
      return text
    }
    return text.slice(0, max).trimEnd() + '…'
  }

  const Item = ({ node }: { node: TextNode }) => (
    <BreadcrumbItem>
      <BreadcrumbLink
        className={'cursor-pointer'}
        onClick={() => dispatch(nodeOpened({ nodeId: node.id }))}
      >
        {ellipsize(20, node.title)}
      </BreadcrumbLink>
    </BreadcrumbItem>
  )

  const Ellipsis = ({ nodes }: { nodes: TextNode[] }) => (
    <BreadcrumbItem>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-1">
          <BreadcrumbEllipsis className="h-4 w-4 cursor-pointer"/>
          <span className="sr-only">Show omitted breadcrumb items</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {nodes.map(node => (
            <DropdownMenuItem>
              <BreadcrumbLink
                className={'cursor-pointer'}
                onClick={() => dispatch(nodeOpened({ nodeId: node.id }))}
              >
                {ellipsize(40, node.title)}
              </BreadcrumbLink>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
  )

  const items = path.length <= 4
    ? path.map(node => ({ key: node.id, rendered: <Item node={node}/> }))
    : [
      ...path.slice(0, 2).map(node => ({ key: node.id, rendered: <Item node={node}/> })),
      { key: '_ellipsis', rendered: <Ellipsis nodes={path.slice(2, -2)}/> },
      ...path.slice(-2).map(node => ({ key: node.id, rendered: <Item node={node}/> })),
    ]

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {items.map((item, i) => (<Fragment key={item.key}>
          {i !== 0 && <BreadcrumbSeparator/>}
          {item.rendered}
        </Fragment>))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
