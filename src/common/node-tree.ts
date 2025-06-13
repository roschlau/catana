import {nanoid} from '@reduxjs/toolkit'
import {isPresent} from '@/renderer/util/optionals'
import {Field, id, Id, Node, NodeGraphFlattened, Property, TextNode} from '@/common/nodes'

export type NodeTree =
  | NodeLink
  | TreeTextNode
  | TreeField
  | TreeProperty

export type TreeTextNode = Omit<TextNode, 'id' | 'ownerId' | 'content'> & {
  id?: string
  content?: NodeTree[],
  expanded?: boolean,
}

export type TreeField = Omit<Field, 'id' | 'ownerId'> & {
  id: string
}

export type TreeProperty = Omit<Property, 'id' | 'ownerId' | 'content' | 'fieldId'> & {
  id?: string
  fieldId: string
  content: (Exclude<NodeTree, TreeProperty>)[]
}

export interface NodeLink {
  type: 'nodeLink'
  nodeId: string
  expanded?: boolean
}

export function flatten(tree: Exclude<NodeTree, NodeLink>): NodeGraphFlattened {
  const nodes: NodeGraphFlattened = {}

  function parseNode(node: TreeTextNode, ownerId: Id<'node' | 'property'> | null): TextNode {
    const nodeId = (node.id ?? nanoid()) as Id<'node'>
    const childRefs = node.content?.map(child => {
      if (child.type === 'nodeLink') {
        return { nodeId: child.nodeId as Id<'node'>, expanded: child.expanded }
      }
      return { nodeId: traverse(child, nodeId), expanded: (child.type === 'node' && child.expanded) }
    }) ?? []
    const { content, ...rest } = node // Making sure `content` isn't included in the flattened tree
    return {
      ...rest,
      id: nodeId,
      ownerId,
      content: childRefs,
    } satisfies TextNode
  }

  function parseProperty(node: TreeProperty, ownerId: Id<'node'>): Property {
    const nodeId = (node.id ?? nanoid()) as Id<'property'>
    const childRefs = node.content.map(child => {
      if (child.type === 'nodeLink') {
        return { nodeId: child.nodeId as Id<'node'>, expanded: child.expanded }
      }
      return { nodeId: traverse(child, nodeId), expanded: (child.type === 'node' && child.expanded) }
    }) as unknown as [Property['content'][1]]
    return {
      id: nodeId,
      type: 'property',
      ownerId,
      fieldId: id(node.fieldId),
      content: childRefs,
    }
  }

  function traverse(node: Exclude<NodeTree, NodeLink>, ownerId: Id<'node' | 'property'> | null): Node['id'] {
    switch (node.type) {
      case 'node': {
        const nodeData = parseNode(node, ownerId)
        nodes[nodeData.id] = nodeData
        return nodeData.id
      }
      case 'property': {
        if (!ownerId) {
          throw new Error(`Cannot create property ${node.id} without owner`)
        }
        const nodeData = parseProperty(node, ownerId as Id<'node'>)
        nodes[nodeData.id] = nodeData
        return nodeData.id
      }
      case 'field': {
        if (!ownerId) {
          throw new Error(`Cannot create field ${node.id} without owner`)
        }
        nodes[node.id] = {
          id: id(node.id),
          type: 'field',
          title: node.title,
          ownerId: ownerId as Id<'node'>, // type check not possible here
        }
        return id(node.id)
      }
    }
  }

  traverse(tree, null)
  return nodes
}

export function buildTree(nodes: NodeGraphFlattened): NodeTree | null {
  const processedNodeIds = new Set<Node['id']>()

  function build(id: Node['id']): Exclude<NodeTree, NodeLink> {
    processedNodeIds.add(id)
    const node = nodes[id]
    if (!node) {
      throw Error(`Error: Node with id '${id}' not found`)
    }
    switch (node.type) {
      case 'node': {
        const { ownerId, content, ...rest } = node
        const result: TreeTextNode = { ...rest, type: 'node', id: node.id }
        // Recursively build children
        if (node.content) {
          result.content = node.content
            .map(({ nodeId: childId, expanded }) => {
              // Check parent relationship integrity
              const child = nodes[childId]
              if (!child) {
                console.error(`Error: TextNode '${id}' lists missing child nodeId '${childId}' in content`)
                return undefined
              }
              if (child.ownerId !== id) {
                return { type: 'nodeLink', nodeId: childId, expanded } satisfies NodeLink
              }
              const childNode = build(childId)
              if (childNode.type === 'node') {
                return { ...childNode, expanded }
              } else {
                return childNode
              }
            })
            .filter(isPresent)
        }
        return result
      }
      case 'property': {
        const result: Omit<TreeProperty, 'content'> = {
          id: node.id,
          type: 'property',
          fieldId: node.fieldId,
        }
        // Recursively build children
        const content = (node.content
          .slice(1) as [Property['content'][1]])
          .map(({ nodeId: childId, expanded }) => {
            // Check parent relationship integrity
            const child = nodes[childId]
            if (!child) {
              console.error(`Error: TextNode '${id}' lists missing child nodeId '${childId}' in content`)
              return undefined
            }
            if (child.ownerId !== id) {
              return { type: 'nodeLink', nodeId: childId, expanded } satisfies NodeLink
            }
            const childNode = build(childId)
            if (childNode.type === 'property') {
              throw new Error(`Error: Property '${id}' contained ${childNode.type} ${childNode.id} as child. This is not allowed.`)
            } else {
              return { ...childNode, expanded }
            }
          })
          .filter(isPresent)
        return {
          ...result,
          content,
        }
      }
      case 'field': {
        return {
          id: node.id,
          type: 'field',
          title: node.title,
        } satisfies TreeField
      }
    }
  }

  if (Object.keys(nodes).length === 0) {
    return null
  }
  const allNodes = Object.values(nodes)
    .filter(isPresent)
  const rootIds = allNodes
    .filter(node => !node.ownerId)
    .map(node => node.id)
  if (rootIds.length > 1) {
    throw new Error(`Multiple root nodes found: ${rootIds.join(', ')}`)
  }
  if (rootIds.length === 0) {
    throw new Error(`No root node found`)
  }
  const result = build(rootIds[0])
  const unreachableNodes = allNodes.filter(node => !processedNodeIds.has(node?.id))
  if (unreachableNodes.length > 0) {
    console.error('Unreachable nodes found', unreachableNodes.map(node => node.id))
  }
  return result
}
