import {nanoid} from '@reduxjs/toolkit'
import {Node, NodeGraphFlattened} from '../common/nodeGraphModel'

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

export function loadTanaExport(fileContent: string): { rootId: string, nodes: NodeGraphFlattened } {
  const { docs } = JSON.parse(fileContent) as TanaExport
  const nodes: Record<string, Node> = {}
  docs.forEach(doc => {
    nodes[doc.id] = {
      type: 'text',
      id: doc.id,
      contentNodeIds: doc.children ?? [],
      title: (doc.props.name ?? 'Untitled Node') + ' (' + doc.id + ')',
      parentNodeId: doc.props._ownerId ?? null,
      expanded: false,
    }
  })
  const roots = Object.values(nodes).filter(node => !node.parentNodeId)
  if (roots.length === 1) {
    return { rootId: roots[0].id, nodes }
  }
  const rootId = 't_import_' + nanoid()
  nodes[rootId] = {
    type: 'text',
    id: rootId,
    title: 'Tana Import Root',
    contentNodeIds: roots.map(root => root.id),
    parentNodeId: null,
    expanded: true,
  }
  roots.forEach(root => {
    root.parentNodeId = rootId
  })
  return { rootId, nodes }
}
