import {nanoid} from '@reduxjs/toolkit'
import {isPresent} from '../../util/optionals'
import {Id, Node, NodeGraphFlattened} from '../../../common/nodeGraphModel'

type Tree =
  | NodeLink
  | TreeNode

type TreeNode = {
  id?: string
  type: 'text'
  title: string
  content?: Tree[],
  expanded?: boolean,
}

export interface NodeLink {
  type: 'nodeLink'
  nodeId: string
  expanded?: boolean
}

export const ROOT_NODE = '_root' as Id<'node'>

export const demoGraph: Exclude<Tree, NodeLink> = {
  type: 'text',
  id: ROOT_NODE,
  title: '👋 Welcome to Catana!',
  expanded: true,
  content: [{
    title: 'Catana is a (still very much WIP) notetaking software that aims to let you keep control of your data like Obsidian or Logseq, but using a data model that\'s closer to Tana.',
    type: 'text',
    id: '1',
  }, {
    title: '💠 Nodes',
    type: 'text',
    expanded: true,
    content: [{
      title: 'Everything in Catana is a Node. Think of them like bullet points, but with superpowers.',
      type: 'text',
      id: '2',
      expanded: true,
      content: [],
    }, {
      title: '↔️ Node Indentation',
      type: 'text',
      id: '2-1',
      expanded: true,
      content: [{
        title: 'Every Node that has others indented under it has a little arrow instead of a bullet, which you can click to expand or collapse it. Try it out on this Node!',
        type: 'text',
        content: [{
          title: 'Easy, right?',
          type: 'text',
          id: '2-1-1',
        }, {
          title: 'You can nest Nodes as deeply as you want. Try nesting this one under the one above by pressing Tab!',
          type: 'text',
          id: '2-1-2',
        },  {
          title: 'Nodes remember if they are expanded or collapsed. That\'s how some of the nodes on this page started expanded while others didn\'t.',
          type: 'text',
        }, {
          title: 'Nodes can also be expanded or collapsed using the Keyboard. Focus on this Node, then press Ctrl + Arrow Down to expand it!',
          type: 'text',
          id: '2-1-3',
          content: [{
            title: 'Nice! In the same way, you can collapse an expanded node by pressing Ctrl + Arrow Up. You can find even more keyboard shortcuts at the bottom of this page!',
            type: 'text',
          }],
        }],
      }],
    }, {
      title: '🔗 Node Linking',
      type: 'text',
      id: '2-2',
      content: [{
        title: 'Nodes can be linked in multiple places. Here\'s a link to the previous node explaining indentation:',
        type: 'text',
      }, {
        type: 'nodeLink',
        nodeId: '2-1',
      }, {
        title: 'Node Links can be identified by the dashed circle around their bullet point or arrow. If you edit a linked node, it will automatically update everywhere it is linked. Try editing the linked node above and see it change live in the other location as well!',
        type: 'text',
        id: '2-2-2',
      }],
    }],
  }, {
    type: 'text',
    title: '⌨️ Keyboard Shortcuts',
    expanded: true,
    content: [{
      type: 'text',
      title: 'Catana has been built to be used efficiently with the keyboard. Below are some of the supported keyboard shortcuts to try!',
    }, {
      type: 'text',
      title: 'Indent / Outdent the focused Node: Tab / Shift + Tab',
    }, {
      type: 'text',
      title: 'Collapse/Expand the focused Node: Ctrl + Arrow Up/Down',
    }, {
      type: 'text',
      title: 'Move the focused Node up/down within its parent Node: Alt + Shift + Arrow Up/Down',
    }],
  }],
}

export function flatten(tree: Exclude<Tree, NodeLink>): NodeGraphFlattened {
  const nodes: NodeGraphFlattened = {}

  function traverse(node: Exclude<Tree, NodeLink>, ownerId: Id<'node'> | null): Id<'node'> {
    const nodeId = (node.id ?? nanoid()) as Id<'node'>
    const childRefs = node.content?.map(child => {
      if (child.type === 'nodeLink') {
        return { nodeId: child.nodeId as Id<'node'>, expanded: child.expanded }
      }
      return { nodeId: traverse(child, nodeId), expanded: child.expanded }
    }) ?? []
    const { content, ...rest } = node // Making sure `content` isn't included in the flattened tree
    nodes[nodeId] = {
      ...rest,
      id: nodeId,
      ownerId,
      content: childRefs,
    } satisfies Node
    return nodeId
  }

  traverse(tree, null)
  return nodes
}

export function buildTree(nodes: NodeGraphFlattened): Tree | null {
  const processedNodeIds = new Set<Id<'node'>>()

  function build(id: Id<'node'>): Exclude<Tree, NodeLink> {
    processedNodeIds.add(id)
    const node = nodes[id]
    if (!node) {
      throw Error(`Error: Node with id '${id}' not found`)
    }
    const { ownerId, content, ...rest } = node
    const result: TreeNode = { ...rest, type: 'text', id }
    // Recursively build children
    if (node.content) {
      result.content = node.content
        .map(({ nodeId: childId, expanded }) => {
          // Check parent relationship integrity
          const child = nodes[childId]
          if (child) {
            if (child.ownerId !== id) {
              return { type: 'nodeLink', nodeId: childId, expanded } satisfies NodeLink
            } else {
              return { ...build(childId), expanded } satisfies Exclude<Tree, NodeLink>
            }
          } else {
            console.error(`Error: TextNode '${id}' lists missing child nodeId '${childId}' in content`)
            return undefined
          }
        })
        .filter(isPresent)
    }
    return result
  }

  if (Object.keys(nodes).length === 0) {
    return null
  }
  const allNodes = Object.values(nodes)
    .filter(isPresent)
  const roots = allNodes
    .filter(node => !node.ownerId)
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
