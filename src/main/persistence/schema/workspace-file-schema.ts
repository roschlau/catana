import {flatten} from '@/common/node-tree'
import {demoGraph, ROOT_NODE} from '@/common/demoGraph'
import * as v1 from './v1'
import * as v2 from './v2'
import * as v3 from './v3'
import * as v4 from './v4'
import {type} from 'arktype'
import {Node} from '@/common/nodes'

export const SaveFile = v4.SaveFile
export type SaveFile = v4.SaveFile

export const emptySaveFile: SaveFile = {
  v: 4,
  currentView: { type: 'node', nodeId: ROOT_NODE },
  nodes: [...Object.values(flatten(demoGraph).nodes as Record<string, Node>)],
  tags: [],
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
  let migrated = saveFile
  while (migrated.v !== 4) {
    console.log(`Save file has version ${migrated.v}, migrating...`)
    migrated = migrateToNextVersion(migrated)
  }
  return migrated
}

function migrateToNextVersion(saveFile: UnmigratedSaveFile): UnmigratedSaveFile {
  switch (saveFile.v) {
    case 4:
      return saveFile
    case 3:
      return v4.migrate(saveFile)
    case 2:
      return v3.migrate(saveFile)
    case 1:
      return v2.migrate(saveFile)
  }
}

const UnmigratedSaveFile = type.or(
  v4.SaveFile,
  v3.SaveFile,
  v2.SaveFile,
  v1.SaveFile,
)
type UnmigratedSaveFile = typeof UnmigratedSaveFile.infer
