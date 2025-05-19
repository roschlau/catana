import {Node, NodeLink, TextNode} from './nodesSlice'
import {nanoid} from '@reduxjs/toolkit'
import {isPresent} from '../../util/optionals'

type TreeNode =
  | PartialBy<Omit<NodeLink, 'parentNodeId'>, 'id'>
  | PartialBy<Omit<TextNode, 'parentNodeId' | 'contentNodeIds'> & { content?: TreeNode[] }, 'id'>

export const ROOT_NODE = '_root'

export const demoGraph: TreeNode = {
  type: 'text',
  id: ROOT_NODE,
  title: 'Welcome to Catana!',
  content: [{
    title: 'Catana is a (still very much WIP) notetaking software that aims to let you keep control of your data like Obsidian or Logseq, but using a data model that\'s closer to Tana.',
    type: 'text',
    id: '1',
  }, {
    title: 'Everything in Catana is a Node. Nodes behave a lot like bullet points in any other notetaking software, but with some twists.',
    type: 'text',
    id: '2',
    content: [{
      title: 'For one, every Node that has others indented under it has little arrow instead of a bullet which you can click to expand or collapse it. Try it out on this Node!',
      type: 'text',
      id: '2-1',
      content: [{
        title: 'Easy, right?',
        type: 'text',
        id: '2-1-1',
      }, {
        title: 'You can nest Nodes as deeply as you want. Try nesting this one under the one above by pressing Tab!',
        type: 'text',
        id: '2-1-2',
      }],
    }, {
      title: 'Nodes can be linked to be shown in other places. See how the explanation of Node nesting from above is linked within this Node?',
      type: 'text',
      id: '2-2',
      content: [{
        type: 'nodeLink',
        id: '2-2-1',
        nodeId: '2-1',
      }, {
        title: 'Node Links can be identified by the dashed circle around their bullet point or arrow. You can edit them just like regular nodes, but be aware that you\'re changing the Node everywhere it is linked!',
        type: 'text',
        id: '2-2-2',
      }],
    }],
  }],
}

export function flatten(tree: TreeNode): Partial<Record<string, Node>> {
  const nodes: Partial<Record<string, Node>> = {}

  function traverse(node: TreeNode, parentNodeId: string | null): string {
    const nodeId = node.id ?? nanoid()

    if (node.type === 'nodeLink') {
      nodes[nodeId] = {
        ...node,
        id: nodeId,
        parentNodeId,
      } satisfies NodeLink
    } else {
      const contentNodeIds = node.content?.map(child => traverse(child, nodeId)) ?? []
      const { content, ...rest } = node // Making sure `content` isn't included in the flattened tree
      nodes[nodeId] = {
        ...rest,
        id: nodeId,
        parentNodeId,
        contentNodeIds,
      } satisfies TextNode
    }
    return nodeId
  }

  traverse(tree, null)
  return nodes
}

export function buildTree(nodes: Partial<Record<string, Node>>): TreeNode | null {
  const processedNodeIds = new Set<string>()

  function build(id: string): TreeNode {
    processedNodeIds.add(id)
    const node = nodes[id]
    if (!node) {
      throw Error(`Error: Node with id '${id}' not found`)
    }
    if (node.type === 'nodeLink') {
      if (!nodes[node.nodeId]) {
        console.warn(`Warning: NodeLink with id '${node.id}' points to missing node '${node.nodeId}'`)
      }
      // Omit parentNodeId
      const { parentNodeId, ...rest } = node
      return rest
    } else {
      const { parentNodeId, contentNodeIds, ...rest } = node
      const result: TreeNode = { ...rest }
      // Recursively build children
      if (node.contentNodeIds) {
        result.content = node.contentNodeIds
          .map((childId) => {
            // Check parent relationship integrity
            const child = nodes[childId]
            if (child) {
              if (child.parentNodeId !== id) {
                console.error(`Error: Node '${childId}' referenced by ${id} but has parentNodeId='${child.parentNodeId}'`)
              }
              return build(childId)
            } else {
              console.error(`Error: TextNode '${id}' lists missing child nodeId '${childId}' in contentNodeIds`)
              return undefined
            }
          })
          .filter(isPresent)
      }
      return result
    }
  }

  if (Object.keys(nodes).length === 0) {
    return null
  }
  const allNodes = Object.values(nodes)
    .filter(isPresent)
  const roots = allNodes
    .filter(node => !node.parentNodeId)
    .map(node => node.id)
  if (roots.length > 1) {
    throw new Error(`Multiple root nodes found: ${roots.join(', ')}`)
  }
  if (roots.length === 0) {
    throw new Error(`No root node found`)
  }
  const result = build(roots[0])
  const unreachableNodes = allNodes.filter(node => !processedNodeIds.has(node?.id))
  if (unreachableNodes.length > 0) {
    console.error('Unreachable nodes found', unreachableNodes.map(node => node.id))
  }
  return result
}
