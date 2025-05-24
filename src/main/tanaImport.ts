import {nanoid} from '@reduxjs/toolkit'
import {Node, NodeGraphFlattened, NodeId} from '../common/nodeGraphModel'

interface TanaExport {
  formatVersion: 1,
  docs: {
    id: string,
    props: {
      name: string,
      description: string,
      _docType: string,
      _ownerId: string | null,
      _metaNodeId: string | null,
    } & Record<string, unknown>
    children: string[] | null,
  }[]
}

export function loadTanaExport(fileContent: string): { rootId: NodeId, nodes: NodeGraphFlattened } {
  const { docs } = JSON.parse(fileContent) as TanaExport
  const nodes: Record<NodeId, Node> = {}
  docs.forEach(doc => {
    const node: Node = {
      id: doc.id,
      content: doc.children?.map(nodeId => ({ nodeId })) ?? [],
      title: (doc.props.name ?? '<Untitled>') + ' (' + doc.props._docType + ', ' + doc.id + ')',
      ownerId: doc.props._ownerId ?? null,
    }
    if (doc.props._metaNodeId) {
      node.content.unshift({ nodeId: doc.props._metaNodeId })
    }
    const { id, children, ...details } = doc
    const detailsNode: Node = {
      id: doc.id + '_details',
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
  const rootId = 't_import_' + nanoid()
  nodes[rootId] = {
    id: rootId,
    title: 'Tana Import Root',
    content: roots.map(root => ({ nodeId: root.id })),
    ownerId: null,
  }
  roots.forEach(root => {
    root.ownerId = rootId
  })
  return { rootId, nodes }
}
