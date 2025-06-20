import {type} from 'arktype'
import {flatten} from '@/common/node-tree'
import {demoGraph, ROOT_NODE} from '@/common/demoGraph'

const CheckboxState = type('"checked" | "unchecked"')

const CheckboxConfig = type({
  type: '"intrinsic"',
  state: CheckboxState,
})

const NodeHistory = type({
  createdTime: 'number',
  lastModifiedTime: 'number',
})

const ParentId = type('string#node|string#property')
const NodeId = type('string#node|string#property|string#field')

const TextNode = type({
  id: 'string#node',
  type: '"node"',
  title: 'string',
  ownerId: type(ParentId, '|', 'null'),
  'checkbox?': CheckboxConfig,
  content: type({
    nodeId: NodeId,
    'expanded?': 'boolean|undefined',
  }).array(),
  history: NodeHistory,
})

const Property = type({
  id: 'string#property',
  type: '"property"',
  ownerId: 'string#node',
  fieldId: 'string#field',
  content: type({
    nodeId: 'string#node',
    'expanded?': 'boolean|undefined',
  }).array(),
  history: NodeHistory,
})

const Field = type({
  id: 'string#field',
  type: '"field"',
  title: 'string',
  ownerId: 'string#node',
  history: NodeHistory,
})

const Node = type.or(TextNode, Property, Field)
export type Node = typeof TextNode.infer | typeof Property.infer | typeof Field.infer

export const SaveFile = type({
  v: '1',
  openedNode: 'string#node|null',
  'debugMode?': 'boolean',
  nodes: Node.array(),
})

export type SaveFile = typeof SaveFile.infer

export const emptySaveFile: SaveFile = {
  v: 1,
  openedNode: ROOT_NODE,
  nodes: [...Object.values(flatten(demoGraph) as Record<string, Node>)],
}
