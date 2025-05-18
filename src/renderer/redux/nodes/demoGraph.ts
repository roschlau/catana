import {Node} from './nodesSlice'

export const ROOT_NODE = '_root'

export const demoGraph: Partial<Record<string, Node>> = {
  [ROOT_NODE]: {
    type: 'text',
    id: ROOT_NODE,
    title: 'Welcome to Catana!',
    parentNodeId: null,
    contentNodeIds: ['1', '2'],
  },
  '1': {
    type: 'text',
    id: '1',
    title: 'Catana is a (still very much WIP) notetaking software that aims to let you keep control of your data like Obsidian or Logseq, but using a data model that\'s closer to Tana.',
    parentNodeId: ROOT_NODE,
    contentNodeIds: [],
  },
  '2': {
    type: 'text',
    id: '2',
    title: 'Everything in Catana is a Node. Nodes behave a lot like bullet points in any other notetaking software, but with some twists.',
    parentNodeId: ROOT_NODE,
    contentNodeIds: ['2-1', '2-2'],
  },
  '2-1': {
    type: 'text',
    id: '2-1',
    title: 'For one, every Node that has others indented under it has little arrow instead of a bullet which you can click to expand or collapse it. Try it out on this Node!',
    parentNodeId: '2',
    contentNodeIds: ['2-1-1', '2-1-2'],
  },
  '2-1-1': {
    type: 'text',
    id: '2-1-1',
    title: 'Easy, right?',
    parentNodeId: '2-1',
    contentNodeIds: [],
  },
  '2-1-2': {
    type: 'text',
    id: '2-1-2',
    title: 'You can nest Nodes as deeply as you want. Try nesting this one under the one above by pressing Tab!',
    parentNodeId: '2-1',
    contentNodeIds: [],
  },
  '2-2': {
    type: 'text',
    id: '2-2',
    title: 'Nodes can be linked to be shown in other places. See how the explanation of Node nesting from above is linked within this Node?',
    parentNodeId: '2',
    contentNodeIds: ['2-2-1', '2-2-2'],
  },
  '2-2-1': {
    type: 'nodeLink',
    id: '2-2-1',
    parentNodeId: '2-2',
    nodeId: '2-1',
  },
  '2-2-2': {
    type: 'text',
    id: '2-2-2',
    parentNodeId: '2-2',
    title: 'Node Links can be identified by the dashed circle around their bullet point or arrow. You can edit them just like regular nodes, but be aware that you\'re changing the Node everywhere it is linked!',
    contentNodeIds: [],
  },
}
