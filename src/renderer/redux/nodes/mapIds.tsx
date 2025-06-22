import {Field, Node, NodeGraphFlattened, Property, TextNode} from '@/common/nodes'

/**
 * Updates all IDs used in the given nodeGraph via `mapId`, keeping links etc. intact. Don't use this on subgraphs whose
 * nodes might be referenced from elsewhere, as those references won't be caught. Meant for assigning random IDs to
 * nodes in a
 */
export function mapIds(nodeGraph: NodeGraphFlattened, mapId: (id: string) => string): NodeGraphFlattened {
  const idMapping = new Map<Node['id'], Node['id']>()

  function replaceId<T extends Node['id']>(id: T): T {
    if (idMapping.has(id)) {
      return idMapping.get(id)! as T
    }
    const newId = mapId(id) as T
    idMapping.set(id, newId)
    return newId as T
  }

  const newGraph: NodeGraphFlattened = {}
  Object.values(nodeGraph).forEach(node => {
    if (!node) return
    let newNode: Node
    switch (node.type) {
      case 'node': {
        const newId = replaceId(node.id)
        newNode = {
          ...node,
          id: newId,
          content: node.content.map(it => ({ ...it, nodeId: replaceId(it.nodeId) })),
          ownerId: node.ownerId ? replaceId(node.ownerId) : null,
        } satisfies TextNode
        break
      }
      case 'field': {
        const newId = replaceId(node.id)
        newNode = {
          ...node,
          id: newId,
          ownerId: replaceId(node.ownerId),
        } satisfies Field
        break
      }
      case 'property': {
        const newId = replaceId(node.id)
        newNode = {
          ...node,
          id: newId,
          content: node.content.map(it => ({ ...it, nodeId: replaceId(it.nodeId) })),
          ownerId: replaceId(node.ownerId),
          fieldId: replaceId(node.fieldId),
        } satisfies Property
        break
      }
    }
    newGraph[newNode.id] = newNode
  })
  return newGraph
}
