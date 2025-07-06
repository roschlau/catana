import {nanoid} from '@reduxjs/toolkit'
import {Id, Node, NodeGraphFlattened, ParentNode, Property, TextNode} from '@/common/nodes'

interface TanaExport {
  formatVersion: 1,
  docs: {
    id: Node['id'],
    props: {
      created: number,
      name: string,
      touchCounts: number[],
      modifiedTs?: number[],
      description?: string,
      _docType?: string,
      _ownerId?: Id<'node'> | null,
      _metaNodeId?: Id<'node'> | null,
    } & Record<string, unknown>
    children: Node['id'][] | null,
  }[]
}

export function loadTanaExport(fileContent: string): { rootId: Id<'node'>, nodes: NodeGraphFlattened } {
  const { docs } = JSON.parse(fileContent) as TanaExport
  const nodes: Record<Node['id'], Node> = {}
  function createNode(doc: TanaExport['docs'][0]) {
    const history: Node['history'] = {
      createdTime: doc.props.created,
      lastModifiedTime: Math.max(...(doc.props.modifiedTs ?? []), doc.props.created),
    }
    const node: TextNode = {
      id: doc.id as Id<'node'>,
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
      ownerId: doc.id as ParentNode['id'],
      content: [],
      history,
    }
    nodes[detailsNode.id] = detailsNode
    node.content.unshift({ nodeId: detailsNode.id })
    nodes[doc.id] = node
  }
  function createField(doc: TanaExport['docs'][0]) {
    const history: Node['history'] = {
      createdTime: doc.props.created,
      lastModifiedTime: Math.max(...(doc.props.modifiedTs ?? []), doc.props.created),
    }
    if (!doc.props._ownerId) {
      throw Error(`Cannot create field ${doc.id} without owner`)
    }
    nodes[doc.id] = {
      id: doc.id as Id<'field'>,
      type: 'field',
      title: (doc.props.name ?? '<Untitled>') + ' (' + doc.props._docType + ', ' + doc.id + ')',
      ownerId: doc.props._ownerId,
      history,
    }
  }
  function createProperty(doc: TanaExport['docs'][0]) {
    const history: Node['history'] = {
      createdTime: doc.props.created,
      lastModifiedTime: Math.max(...(doc.props.modifiedTs ?? []), doc.props.created),
    }
    if (!doc.props._ownerId) {
      console.warn(`Cannot create property ${doc.id} without owner, falling back to normal node`)
      createNode(doc)
      return
    }
    if (!doc.children || doc.children.length < 2) {
      console.warn(`Cannot create property ${doc.id} with less than 2 children, falling back to normal node`)
      createNode(doc)
      return
    }
    const node: Property = {
      id: doc.id as Id<'property'>,
      type: 'property',
      content: doc.children.slice(1).map(nodeId => ({ nodeId: nodeId as Id<'node'> })) ?? [],
      ownerId: doc.props._ownerId,
      fieldId: doc.children[0] as Id<'field'>,
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
      ownerId: doc.id as Id<'property'>,
      content: [],
      history,
    }
    nodes[detailsNode.id] = detailsNode
    node.content.unshift({ nodeId: detailsNode.id })
    nodes[doc.id] = node
  }
  docs.forEach(doc => {
    switch (doc.props._docType) {
      case 'tuple':
        createProperty(doc)
        break
      case 'attrDef':
        createField(doc)
        break
      default:
        createNode(doc)
        break
    }
  })
  const roots = Object.values(nodes).filter(node => !node.ownerId)
  if (roots.length === 1) {
    return { rootId: roots[0].id as Id<'node'>, nodes }
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
