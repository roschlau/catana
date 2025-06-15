import {nanoid} from '@reduxjs/toolkit'
import {Id, Node, NodeGraphFlattened, TextNode} from '@/common/nodes'

interface TanaExport {
  formatVersion: 1,
  docs: {
    id: Id<'node'>,
    props: {
      created: number,
      name: string,
      touchCounts: number[],
      modifiedTs?: number[],
      description?: string,
      _docType?: string,
      _ownerId?: Id<'node'> | null,
      _metaNodeId?: Id<'node'> | null,
    } & Record<Id<'node'>, unknown>
    children: Id<'node'>[] | null,
  }[]
}

export function loadTanaExport(fileContent: string): { rootId: Id<'node'>, nodes: NodeGraphFlattened } {
  const { docs } = JSON.parse(fileContent) as TanaExport
  const nodes: Record<Id<'node'>, TextNode> = {}
  docs.forEach(doc => {
    const history: Node['history'] = {
      createdTime: doc.props.created,
      lastModifiedTime: Math.max(...(doc.props.modifiedTs ?? []), doc.props.created),
    }
    const node: TextNode = {
      id: doc.id,
      type: 'node',
      content: doc.children?.map(nodeId => ({ nodeId })) ?? [],
      title: (doc.props.name ?? '<Untitled>') + ' (' + doc.props._docType + ', ' + doc.id + ')',
      ownerId: doc.props._ownerId ?? null,
      history,
    }
    if (doc.props._metaNodeId) {
      node.content.unshift({ nodeId: doc.props._metaNodeId })
    }
    const { id, children, ...details } = doc
    const detailsNode: TextNode = {
      id: doc.id + '_details' as Id<'node'>,
      type: 'node',
      title: JSON.stringify(details),
      ownerId: doc.id,
      content: [],
      history,
    }
    nodes[detailsNode.id] = detailsNode
    node.content.unshift({ nodeId: detailsNode.id })
    nodes[doc.id] = node
  })
  const roots = Object.values(nodes).filter(node => !node.ownerId)
  if (roots.length === 1) {
    return { rootId: roots[0].id, nodes }
  }
  const rootId = 't_import_' + nanoid() as Id<'node'>
  nodes[rootId] = {
    id: rootId,
    type: 'node',
    title: 'Tana Import Root',
    content: roots.map(root => ({ nodeId: root.id })),
    ownerId: null,
    history: {
      createdTime: new Date().getTime(),
      lastModifiedTime: new Date().getTime(),
    }
  }
  roots.forEach(root => {
    root.ownerId = rootId
  })
  return { rootId, nodes }
}
