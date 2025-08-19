// noinspection DuplicatedCode

import {type} from 'arktype'
import * as v3 from '@/main/persistence/schema/v3'

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
  history: type({
    createdTime: 'number',
    lastModifiedTime: 'number',
  }),
})

const Node = type.or(TextNode, Property, Field)
export type Node = typeof TextNode.infer | typeof Property.infer | typeof Field.infer

const View = type({ type: '"node"', nodeId: 'string#node' })
  .or(type({ type: '"tag"', tagId: 'string#tag' }))

export const SaveFile = type({
  v: '4',
  currentView: View.or('null'),
  'debugMode?': 'boolean',
  nodes: Node.array(),
  tags: Tag.array().default(() => []),
})

export type SaveFile = typeof SaveFile.infer

export function migrate(v3: v3.SaveFile): SaveFile {
  const { openedNode, tags, ...rest } = v3
  return {
    ...rest,
    v: 4,
    currentView: openedNode ? { type: 'node', nodeId: openedNode } : null,
    tags: tags.map(tag => ({ ...tag, history: { createdTime: Date.now(), lastModifiedTime: Date.now() } })),
  }
}
