import {Id, NodeGraphFlattened} from '@/common/nodes'

export interface CatanaAPI {
  loadTanaExport: () => Promise<{ rootId: Id<'node'>, nodes: NodeGraphFlattened } | null>,
}

declare global {
  // noinspection JSUnusedGlobalSymbols
  interface Window {
    catanaAPI: CatanaAPI
  }
}
