import {nanoid} from '@reduxjs/toolkit'
import {Id, Node, NodeGraphFlattened} from '../common/nodeGraphModel'

interface TanaExport {
  formatVersion: 1,
  docs: {
    id: Id<'node'>,
    props: {
      name: string,
      description: string,
      _docType: string,
      _ownerId: Id<'node'> | null,
      _metaNodeId: Id<'node'> | null,
    } & Record<Id<'node'>, unknown>
    children: Id<'node'>[] | null,
  }[]
}

export function loadTanaExport(fileContent: string): { rootId: Id<'node'>, nodes: NodeGraphFlattened } {
  const { docs } = JSON.parse(fileContent) as TanaExport
  const nodes: Record<Id<'node'>, Node> = {}
  docs.forEach(doc => {
    const node: Node = {
      id: doc.id,
      type: 'node',
      content: doc.children?.map(nodeId => ({ nodeId })) ?? [],
      title: (doc.props.name ?? '<Untitled>') + ' (' + doc.props._docType + ', ' + doc.id + ')',
      ownerId: doc.props._ownerId ?? null,
    }
    if (doc.props._metaNodeId) {
      node.content.unshift({ nodeId: doc.props._metaNodeId })
    }
    const { id, children, ...details } = doc
    const detailsNode: Node = {
      id: doc.id + '_details' as Id<'node'>,
      type: 'node',
      title: JSON.stringify(details),
      ownerId: doc.id,
      content: [],
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
  }
  roots.forEach(root => {
    root.ownerId = rootId
  })
  return { rootId, nodes }
}
