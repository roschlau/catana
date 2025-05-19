import {Node, NodeLink, TextNode} from './nodesSlice'
import {nanoid} from '@reduxjs/toolkit'

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
