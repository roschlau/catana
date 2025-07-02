import {flatten} from '@/common/node-tree'
import {demoGraph, ROOT_NODE} from '@/common/demoGraph'
import * as v1 from './v1'
import * as v2 from './v2'
import {type} from 'arktype'

export const SaveFile = v2.SaveFile
export type SaveFile = v2.SaveFile
type Node = v2.Node

export const emptySaveFile: SaveFile = {
  v: 2,
  openedNode: ROOT_NODE,
  nodes: [...Object.values(flatten(demoGraph) as Record<string, Node>)],
}

export function loadSaveFile(content: string): SaveFile {
  const saveFile = UnmigratedSaveFile(JSON.parse(content))
  if (saveFile instanceof type.errors) {
    console.error(saveFile)
    throw Error(`Invalid save file: ${saveFile.summary}`)
  }
  return migrate(saveFile)
}

export function migrate(saveFile: UnmigratedSaveFile): SaveFile {
  if (saveFile.v === 2) {
    return saveFile
  }
  console.log(`Save file has version ${saveFile.v}, migrating...`)
  return v2.migrate(saveFile)
}

const UnmigratedSaveFile = type.or(
  v2.SaveFile,
  v1.SaveFile,
)
type UnmigratedSaveFile = typeof UnmigratedSaveFile.infer
