import {CheckboxConfig, CheckboxState} from '@/common/checkboxes'
import {Brand} from '@ark/util/'

export type Node =
  | TextNode
  | Property
  | Field

/** Covers all node types that can contain other nodes as children. */
export type ParentNode =
  | TextNode
  | Property

export interface TextNode {
  id: Id<'node'>
  type: 'node'
  title: string
  ownerId: ParentNode['id'] | null
  checkbox?: CheckboxConfig
  content: {
    nodeId: Node['id'],
    expanded?: boolean,
  }[]
  history: NodeHistory
}

export interface Property {
  id: Id<'property'>
  type: 'property'
  ownerId: Id<'node'>
  fieldId: Id<'field'>,
  content: { nodeId: Id<'node'>, expanded?: boolean }[]
  history: NodeHistory
}

export interface Field {
  id: Id<'field'>
  type: 'field'
  title: string
  ownerId: Id<'node'>
  history: NodeHistory
}

export type NodeHistory = {
  createdTime: number,
  lastModifiedTime: number,
  checkbox?: CheckboxHistoryEntry[]
}

export type CheckboxHistoryEntry = [number, CheckboxState | null]

export type NodeOfType<T extends Node['type']> = Node & { type: T }

/**
 * Alias for string, but typed in a way to ensure we can't accidentally cross-assign IDs of a certain type with IDs of
 * other types, or even strings. If you actually need to convert a string into an ID, you can use `str as Id<'type'>`.
 *
 * Inspiration for this approach taken from here: https://michalzalecki.com/nominal-typing-in-typescript/#approach-4-intersection-types-and-brands
 */
export type Id<T extends Node['type']> = Brand<string, T>

export function id<T extends Node['type']>(id: string): Id<T> {
  return id as Id<T>
}

/**
 * True if the passed node is of a type that allows it to contain children.
 * @deprecated Try to use the type system.
 */
export function isParentNode(node: Node): node is ParentNode {
  return node.type === 'node' || node.type === 'property'
}

export type NodeGraphFlattened = Partial<Record<string, Node>>
