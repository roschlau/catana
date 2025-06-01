import {Doc, id, Id, Node, NodeGraphFlattened, Property} from '@/common/nodeGraphModel'
import {nanoid} from '@reduxjs/toolkit'
import {isPresent} from '@/renderer/util/optionals'

export type DocTree =
  | NodeLink
  | TreeNode
  | TreeField
  | TreeProperty

export type TreeNode = {
  id?: string
  type: 'node'
  title: string
  content?: DocTree[],
  expanded?: boolean,
}

export type TreeField = {
  id: string
  type: 'field'
  title: string
}

export type TreeProperty = {
  id?: string
  type: 'property'
  fieldId: string,
  content: (Exclude<DocTree, TreeProperty>)[]
}

export interface NodeLink {
  type: 'nodeLink'
  nodeId: string
  expanded?: boolean
}

export function flatten(tree: Exclude<DocTree, NodeLink>): NodeGraphFlattened {
  const nodes: NodeGraphFlattened = {}

  function parseNode(node: TreeNode, ownerId: Id<'node' | 'property'> | null): Node {
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
    } satisfies Node
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

  function traverse(node: Exclude<DocTree, NodeLink>, ownerId: Id<'node' | 'property'> | null): Doc['id'] {
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

export function buildTree(nodes: NodeGraphFlattened): DocTree | null {
  const processedNodeIds = new Set<Doc['id']>()

  function build(id: Doc['id']): Exclude<DocTree, NodeLink> {
    processedNodeIds.add(id)
    const node = nodes[id]
    if (!node) {
      throw Error(`Error: Node with id '${id}' not found`)
    }
    switch (node.type) {
      case 'node': {
        const { ownerId, content, ...rest } = node
        const result: TreeNode = { ...rest, type: 'node', id }
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
