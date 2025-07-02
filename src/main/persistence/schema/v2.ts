// noinspection DuplicatedCode

import {type} from 'arktype'
import * as v1 from '@/main/persistence/schema/v1'

const CheckboxState = type('boolean|"indeterminate"')

const CheckboxConfig = type({
  type: '"intrinsic"',
  state: CheckboxState,
})

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
  v: '2',
  openedNode: 'string#node|null',
  'debugMode?': 'boolean',
  nodes: Node.array(),
})

export type SaveFile = typeof SaveFile.infer

export function migrate(v1: v1.SaveFile): SaveFile {
  function migrateNode(node: v1.Node): Node {
    if (node.type !== 'node') {
      return node
    }
    if (!node.checkbox) {
      // Inference not quite doing what it should here
      return node as Node
    }
    return {
      ...node,
      checkbox: { type: 'intrinsic', state: node.checkbox.state === 'checked' },
    }
  }

  return {
    ...v1,
    v: 2,
    nodes: [...v1.nodes.map(migrateNode)],
  }
}
