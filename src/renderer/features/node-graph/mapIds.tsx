import {Field, Node, NodeGraphFlattened, Property, TextNode} from '@/common/nodes'

/**
 * Replaces the ID of every node in the given nodeGraph with the result of passing it to `mapId`, and updates all
 * references within the node graph to make sure they keep pointing to the same nodes.
 * References pointing to nodes that are not part of the passed node graph will be kept unchanged.
 *
 * This function can be used for assigning new random IDs to nodes duplicated from a template while keeping internal
 * references within the template intact.
 */
export function mapIds(nodeGraph: NodeGraphFlattened, mapId: (id: string) => string): NodeGraphFlattened {
  const idMapping = new Map<Node['id'], Node['id']>()

  Object.values(nodeGraph).forEach(node => {
    if (!node) return
    if (idMapping.has(node.id)) {
      throw new Error(`Duplicate node id '${node.id}'`)
    }
    idMapping.set(node.id, mapId(node.id) as Node['id'])
  })

  function replaceId<T extends Node['id']>(id: T): T {
    return idMapping.has(id) ? idMapping.get(id)! as T : id
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
