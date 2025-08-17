// noinspection DuplicatedCode

import {type} from 'arktype'
import * as v2 from '@/main/persistence/schema/v2'

const CheckboxState = type('boolean|"indeterminate"')

const NodeHistory = type({
  createdTime: 'number',
  lastModifiedTime: 'number',
  'checkbox?': type(['number', CheckboxState.or('null')]).array(),
})

const ParentId = type('string#node|string#property')
const NodeId = type('string#node|string#property|string#field')

const TextNode = type({
  id: 'string#node',
  type: '"node"',
  title: 'string',
  ownerId: type(ParentId, '|', 'null'),
  'checkbox?': CheckboxState.or('undefined'),
  'tags?': 'string#tag[]|undefined',
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

const Tag = type({
  id: 'string#tag',
  name: 'string',
  hue: 'number',
})

const Node = type.or(TextNode, Property, Field)
export type Node = typeof TextNode.infer | typeof Property.infer | typeof Field.infer

export const SaveFile = type({
  v: '3',
  openedNode: 'string#node|null',
  'debugMode?': 'boolean',
  nodes: Node.array(),
  tags: Tag.array().default(() => []),
})

export type SaveFile = typeof SaveFile.infer

export function migrate(v2: v2.SaveFile): SaveFile {
  function migrateNode(node: v2.Node): Node {
    if (node.type !== 'node') {
      return node
    }
    if (!node.checkbox) {
      // Inference not quite doing what it should here
      return node as Node
    }
    return {
      ...node,
      checkbox: node.checkbox.state,
    }
  }

  return {
    ...v2,
    v: 3,
    nodes: [...v2.nodes.map(migrateNode)],
    tags: [],
  }
}
