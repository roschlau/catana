import {nanoid} from '@reduxjs/toolkit'
import {Node, NodeGraphFlattened, NodeId, NodeLink, TextNode} from '../common/nodeGraphModel'

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
    const node: TextNode = {
      type: 'text',
      id: doc.id,
      contentNodeIds: doc.children ?? [],
      title: (doc.props.name ?? '<Untitled>') + ' (' + doc.props._docType + ', ' + doc.id + ')',
      parentNodeId: doc.props._ownerId ?? null,
      expanded: false,
    }
    if (doc.props._metaNodeId) {
      const metaNodeLink: NodeLink = {
        id: doc.id + '_meta',
        type: 'nodeLink',
        nodeId: doc.props._metaNodeId,
        parentNodeId: doc.id,
        expanded: false,
      }
      nodes[metaNodeLink.id] = metaNodeLink
      node.contentNodeIds.unshift(metaNodeLink.id)
    }
    const { id, children, ...details } = doc
    const detailsNode: TextNode = {
      id: doc.id + '_details',
      type: 'text',
      title: JSON.stringify(details),
      parentNodeId: doc.id,
      contentNodeIds: [],
      expanded: false,
    }
    nodes[detailsNode.id] = detailsNode
    node.contentNodeIds.unshift(detailsNode.id)
    nodes[doc.id] = node
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
