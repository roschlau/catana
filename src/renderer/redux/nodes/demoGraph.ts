import {nanoid} from '@reduxjs/toolkit'
import {PartialBy} from '../../util/types'
import {isPresent} from '../../util/optionals'
import {NodeGraphFlattened, NodeLink, TextNode} from '../../../common/nodeGraphModel'

type TreeNode =
  | PartialBy<Omit<NodeLink, 'parentNodeId'>, 'id' | 'expanded'>
  | PartialBy<Omit<TextNode, 'parentNodeId' | 'contentNodeIds'> & { content?: TreeNode[] }, 'id' | 'expanded'>

export const ROOT_NODE = '_root'

export const demoGraph: TreeNode = {
  type: 'text',
  id: ROOT_NODE,
  title: 'Welcome to Catana!',
  expanded: true,
  content: [{
    title: 'Catana is a (still very much WIP) notetaking software that aims to let you keep control of your data like Obsidian or Logseq, but using a data model that\'s closer to Tana.',
    type: 'text',
    id: '1',
  }, {
    title: 'Everything in Catana is a Node. Nodes behave a lot like bullet points in any other notetaking software, but with some twists.',
    type: 'text',
    id: '2',
    expanded: true,
    content: [{
      title: 'For one, every Node that has others indented under it has a little arrow instead of a bullet which you can click to expand or collapse it. Try it out on this Node!',
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
      }, {
        title: 'Nodes can also be expanded or collapsed using the Keyboard. Focus on this Node, then press Ctrl + Arrow Down to expand it!',
        type: 'text',
        id: '2-1-3',
        content: [{
          title: 'Nice! In the same way, you can collapse an expanded node by pressing Ctrl + Arrow Up. You can find even more keyboard shortcuts at the bottom of this page!',
          type: 'text',
        }]
      }],
    }, {
      title: 'Nodes can be linked to be shown in other places. Open this Node to see a link to the previous Node!',
      type: 'text',
      id: '2-2',
      content: [{
        type: 'nodeLink',
        id: '2-2-1',
        nodeId: '2-1',
      }, {
        title: 'Node Links can be identified by the dashed circle around their bullet point or arrow. You can edit them just like regular nodes, and it will automatically update everywhere it is linked. Try editing the linked node above and see it change live in the other location as well!',
        type: 'text',
        id: '2-2-2',
      }],
    }],
  }, {
    type: 'text',
    title: 'Keyboard Shortcuts',
    expanded: true,
    content: [{
      type: 'text',
      title: 'Catana has been built to be used efficiently with the keyboard. Below are some of the supported keyboard shortcuts to try!',
    }, {
      type: 'text',
      title: 'Tab / Shift + Tab: Indent / Outdent the focused Node',
    }, {
      type: 'text',
      title: 'Ctrl + Arrow Up/Down: Collapse/Expand the focused Node',
    }, {
      type: 'text',
      title: 'Alt + Shift + Arrow Up/Down: Move the focused Node up/down within its parent Node',
    }]
  }],
}

export function flatten(tree: TreeNode): NodeGraphFlattened {
  const nodes: NodeGraphFlattened = {}

  function traverse(node: TreeNode, parentNodeId: string | null): string {
    const nodeId = node.id ?? nanoid()

    if (node.type === 'nodeLink') {
      nodes[nodeId] = {
        ...node,
        id: nodeId,
        parentNodeId,
        expanded: node.expanded ?? false,
      } satisfies NodeLink
    } else {
      const contentNodeIds = node.content?.map(child => traverse(child, nodeId)) ?? []
      const { content, ...rest } = node // Making sure `content` isn't included in the flattened tree
      nodes[nodeId] = {
        ...rest,
        id: nodeId,
        parentNodeId,
        expanded: node.expanded ?? false,
        contentNodeIds,
      } satisfies TextNode
    }
    return nodeId
  }

  traverse(tree, null)
  return nodes
}

export function buildTree(nodes: NodeGraphFlattened): TreeNode | null {
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
