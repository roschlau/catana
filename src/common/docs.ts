import {CheckboxConfig} from '@/common/checkboxes'


export type Doc =
  | Node
  | Property
  | Field

/** Covers all node types that can contain other docs as children. */
export type ParentDoc =
  | Node
  | Property

export interface Node {
  id: Id<'node'>
  type: 'node'
  title: string
  ownerId: ParentDoc['id'] | null
  checkbox?: CheckboxConfig
  content: {
    nodeId: Doc['id'],
    expanded?: boolean,
  }[]
}

export interface Property {
  id: Id<'property'>
  type: 'property'
  ownerId: Id<'node'>
  fieldId: Id<'field'>,
  content: { nodeId: Id<'node'>, expanded?: boolean }[]
}

export interface Field {
  id: Id<'field'>
  type: 'field'
  title: string
  ownerId: Id<'node'>
}

export type DocOfType<T extends Doc['type']> = Doc & { type: T }

/**
 * Alias for string, but typed in a way to ensure we can't accidentally cross-assign IDs of a certain type with IDs of
 * other types, or even strings. If you actually need to convert a string into an ID, you can use `str as Id<'type'>`.
 *
 * Inspiration for this approach taken from here: https://michalzalecki.com/nominal-typing-in-typescript/#approach-4-intersection-types-and-brands
 */
export type Id<T extends Doc['type']> = string & { __brand: T }

export function id<T extends Doc['type']>(id: string): Id<T> {
  return id as Id<T>
}

/**
 * True if the passed doc is of a type that allows it to contain children.
 * @deprecated Try to use the type system.
 */
export function isParentDoc(doc: Doc): doc is ParentDoc {
  return doc.type === 'node' || doc.type === 'property'
}

export type DocGraphFlattened = Partial<Record<string, Doc>>
