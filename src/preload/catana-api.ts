import {Id, NodeGraphFlattened} from '@/common/nodes'
import {SaveFile} from '@/main/nodegraph-file-schema'

export interface CatanaAPI {
  openNodeGraph: (mode: 'last' | 'pick') => Promise<OpenNodeGraphResult | null>
  saveNodeGraph: (content: SaveFile) => Promise<void>
  loadTanaExport: () => Promise<{ rootId: Id<'node'>, nodes: NodeGraphFlattened } | null>
}

export interface OpenNodeGraphResult {
  path: string,
  content: SaveFile,
}

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    catanaAPI: CatanaAPI
  }
}
